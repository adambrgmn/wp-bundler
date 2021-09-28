import * as fs from 'fs/promises';
import * as path from 'path';
import { Loader, Location, PartialMessage, Plugin } from 'esbuild';
import ts from 'typescript';
import md5 from 'md5';
import { BundlerPlugin } from '../types';
import {
  extractTranslations,
  mightHaveTranslations,
  TranslationMessage,
} from '../utils/extract-translations';
import { ExtendedPO } from '../utils/pofile';

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

    let [pot, ...pos] = await Promise.all([
      ExtendedPO.create(project.paths.absolute(translationsConfig.pot)),
      ...translationsConfig.pos.map((po) =>
        ExtendedPO.create(project.paths.absolute(po)),
      ),
    ]);

    /**
     * Parse each source file and extract all translations. Append them to our
     * po- and pot-files.
     */
    build.onLoad(
      { filter: /.(js|ts|tsx|jsx)$/, namespace: '' },
      async (args) => {
        let relativePath = project.paths.relative(args.path);
        let source = await fs.readFile(args.path, 'utf-8');
        let loader = loaders[path.extname(args.path)];

        let warnings: PartialMessage[] | undefined = undefined;
        if (mightHaveTranslations(source)) {
          let fileTranslations = extractTranslations(source);

          for (let translation of fileTranslations) {
            if (translation.domain !== translationsConfig.domain) continue;
            pot.append(translation, { path: relativePath, source: source });
            pos.forEach((po) => {
              return po.append(translation, {
                path: relativePath,
                source: source,
              });
            });
          }

          warnings = validateTranslations(
            fileTranslations,
            source,
            relativePath,
          );
        }

        return { contents: source, loader, warnings };
      },
    );

    /**
     * Write all po- and pot-files to disk.
     */
    build.onEnd(async ({ metafile, warnings }) => {
      await Promise.all([pot.write(), ...pos.map((po) => po.write())]);

      if (metafile == null) return;

      let langDir = project.paths.absolute(config.outdir, 'languages');
      await fs.mkdir(langDir, { recursive: true });

      let missingLangWarnings: ExtendedPO[] = [];

      for (let distFile of Object.keys(metafile.outputs)) {
        let meta = metafile.outputs[distFile];
        let srcFiles = Object.keys(meta.inputs);
        for (let po of pos) {
          if (po.headers.Language == null || po.headers.Language === '') {
            missingLangWarnings.push(po);
            continue;
          }

          let jed = po.toJED(({ references }) =>
            references.some((ref) =>
              srcFiles.includes(ref.replace(/:\d+$/, '')),
            ),
          );
          if (jed == null) continue;

          let domain = translationsConfig.domain;
          let language = po.headers.Language;
          let md5Path = md5(distFile);
          let filename = `${domain}-${language}-${md5Path}`;
          await fs.writeFile(
            path.join(langDir, filename),
            JSON.stringify(jed, null, 2),
          );
        }
      }

      warnings.push(
        ...missingLangWarnings
          .filter((po, i, arr) => arr.indexOf(po) === i)
          .map((po) => {
            return {
              pluginName: name,
              text: 'The po file is missing a language header',
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

function validateTranslations(
  translations: TranslationMessage[],
  source: string,
  file: string,
): PartialMessage[] {
  let warnings: PartialMessage[] = [];

  for (let translation of translations) {
    if (translation.domain == null) {
      warnings.push({
        pluginName: name,
        text: 'Missing domain.',
        location: nodeToLocation(translation.node, source, file),
      });
    }
  }

  return warnings;
}

function nodeToLocation(node: ts.Node, source: string, file: string): Location {
  let substring = source.substr(0, node.pos);
  let lines = substring.split('\n');
  let line = lines.length;
  let column = lines[line - 1].length;

  return {
    file,
    namespace: '',
    line,
    column,
    length: 1,
    lineText: '',
    suggestion: '',
  };
}
