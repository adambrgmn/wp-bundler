import * as fs from 'fs/promises';
import * as path from 'path';
import { Loader, PartialMessage, Plugin } from 'esbuild';
import globby from 'globby';
import md5 from 'md5';
import { BundlerPlugin } from '../types';
import { js, php, twig, theme, TranslationMessage } from '../utils/extract-translations';
import { Po } from '../utils/po';

let name = 'wp-bundler-translations';

let loaders: Record<string, Loader | undefined> = {
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx',
};

export const translations: BundlerPlugin = ({ project, config }): Plugin => ({
  name,
  async setup(build) {
    if (config.translations == null) return;

    let translationsConfig = config.translations;
    let translations: TranslationMessage[] = [];

    build.onStart(() => {
      translations = [];
    });

    /**
     * Parse each source file and extract all translations.
     */
    build.onLoad({ filter: /.(js|ts|tsx|jsx)$/, namespace: '' }, async (args) => {
      let relativePath = project.paths.relative(args.path);
      let source = await fs.readFile(args.path, 'utf-8');
      let loader = loaders[path.extname(args.path)];

      let warnings: PartialMessage[] | undefined = undefined;

      if (js.mightHaveTranslations(source)) {
        let fileTranslations = js.extractTranslations(source, relativePath);
        translations.push(...fileTranslations.filter(({ domain }) => domain === translationsConfig.domain));
        warnings = validateTranslations(fileTranslations);
      }

      return { contents: source, loader, warnings };
    });

    /**
     * Write all po- and pot-files to disk.
     */
    build.onEnd(async ({ metafile, warnings }) => {
      if (metafile == null) return;

      translations.unshift(...(await findThemeTranslations(project.paths.root, translationsConfig.domain)));
      translations.push(
        ...(await findPhpTranslations(project.paths.root, translationsConfig.domain, translationsConfig.ignore)),
        ...(await findTwigTranslations(project.paths.root, translationsConfig.domain, translationsConfig.ignore)),
      );

      let pot = await Po.load(project.paths.absolute(translationsConfig.pot));
      let pos = await Promise.all(translationsConfig.pos?.map((po) => Po.load(project.paths.absolute(po))) ?? []);

      pot.clear();
      for (let t of translations) pot.set(t);

      pos.forEach((po) => po.updateFromTemplate(pot));
      await Promise.all([pot.write(), ...pos.map((po) => po.write())]);

      let langDir = project.paths.absolute(config.outdir, 'languages');
      await fs.mkdir(langDir, { recursive: true });
      let missingLangWarnings: Po[] = [];

      let writes: Promise<unknown>[] = [];
      for (let po of pos) {
        if (po.language == null) {
          missingLangWarnings.push(po);
          continue;
        }

        let buffer = po.toMo();
        writes.push(fs.writeFile(po.filename.replace(/\.po$/, '.mo'), buffer));

        for (let distFile of Object.keys(metafile.outputs)) {
          let meta = metafile.outputs[distFile];
          let srcFiles = Object.keys(meta.inputs);

          let jed = po.toJed(translationsConfig.domain, ({ comments }) => {
            return comments != null && srcFiles.some((file) => comments.reference.includes(file));
          });

          if (jed == null) continue;
          let filename = generateTranslationFilename(translationsConfig.domain, po.headers.Language, distFile);
          writes.push(fs.writeFile(path.join(langDir, filename), JSON.stringify(jed)));
        }
      }

      await Promise.all(writes);
      warnings.push(
        ...missingLangWarnings.map((po) => {
          return {
            pluginName: name,
            text: 'Missing language header in po file. No translations will be emitted.',
            location: {
              file: project.paths.relative(po.filename),
              line: 1,
              column: 1,
              namespace: '',
              lineText: '',
              length: 0,
              suggestion: '',
            },
            detail: {},
            notes: [],
          };
        }),
      );
    });
  },
});

function validateTranslations(translations: TranslationMessage[]): PartialMessage[] {
  let warnings: PartialMessage[] = [];

  for (let translation of translations) {
    if (translation.domain == null) {
      warnings.push({
        pluginName: name,
        text: 'Missing domain.',
        location: translation.location,
      });
    }
  }

  return warnings;
}

async function findPhpTranslations(cwd: string, domain: string, ignore: string[] = []): Promise<TranslationMessage[]> {
  let files = await globby(['**/*.php', '!vendor', '!node_modules', ...ignore.map((i) => '!' + i)], { cwd });

  let translations: Array<TranslationMessage[]> = await Promise.all(
    files.map(async (file) => {
      let source = await fs.readFile(path.join(cwd, file), 'utf-8');
      if (!php.mightHaveTranslations(source)) return [];
      return php.extractTranslations(source, file);
    }),
  );

  return translations.flat().filter((translation) => translation.domain === domain);
}

async function findTwigTranslations(cwd: string, domain: string, ignore: string[] = []): Promise<TranslationMessage[]> {
  let files = await globby(['**/*.twig', '!vendor', '!node_modules', ...ignore.map((i) => '!' + i)], { cwd });

  let translations: Array<TranslationMessage[]> = await Promise.all(
    files.map(async (file) => {
      let source = await fs.readFile(path.join(cwd, file), 'utf-8');
      if (!twig.mightHaveTranslations(source)) return [];
      return twig.extractTranslations(source, file);
    }),
  );

  return translations.flat().filter((translation) => translation.domain === domain);
}

async function findThemeTranslations(cwd: string, domain: string) {
  try {
    let source = await fs.readFile(path.join(cwd, 'style.css'), 'utf-8');
    return theme.extractTranslations(source, 'style.css', domain);
  } catch (error) {
    return [];
  }
}

function generateTranslationFilename(domain: string, language: string, file: string): string {
  let md5Path = md5(file);
  return `${domain}-${language}-${md5Path}.json`;
}
