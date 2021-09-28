import * as fs from 'fs/promises';
import * as path from 'path';
import { Loader, Plugin } from 'esbuild';
import { BundlerPlugin } from '../types';
import {
  extractTranslations,
  mightHaveTranslations,
  TranslationMessage,
} from '../utils/extract-translations';

export const translations: BundlerPlugin = ({ config }): Plugin => ({
  name: 'wp-bundler-translations',
  setup(build) {
    let translations: TranslationMessage[] = [];
    build.onLoad(
      { filter: /.(js|ts|tsx|jsx)$/, namespace: '' },
      async (args) => {
        let contents = await fs.readFile(args.path, 'utf-8');
        let loader = path.extname(args.path).replace('.', '') as Loader;

        if (mightHaveTranslations(contents)) {
          translations.push(...extractTranslations(contents));
        }

        return {
          contents,
          loader,
          warnings: [
            {
              pluginName: 'wp-bundler-translations',
              text: 'Missing domain',
            },
          ],
        };
      },
    );

    build.onEnd(() => {
      console.log(translations);
    });
  },
});
// export interface PartialMessage {
//   pluginName?: string;
//   text?: string;
//   location?: Partial<Location> | null;
//   notes?: PartialNote[];
//   detail?: any;
// }
