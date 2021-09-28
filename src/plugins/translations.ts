import * as fs from 'fs/promises';
import * as path from 'path';
import { Loader, Location, PartialMessage, Plugin } from 'esbuild';
import ts from 'typescript';
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
  setup(build) {
    if (config.translations == null) return;

    let { translations } = config;

    let pot: ExtendedPO | null = null;
    let pos: ExtendedPO[] = [];

    build.onStart(async () => {
      [pot, ...pos] = await Promise.all([
        ExtendedPO.create(project.paths.absolute(translations.pot)),
        ...translations.pos.map((po) =>
          ExtendedPO.create(project.paths.absolute(po)),
        ),
      ]);
    });

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
            pot!.append(translation, { path: relativePath, source: source });
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

    build.onEnd(async () => {
      await Promise.all([pot!.write(), ...pos.map((po) => po.write())]);
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
