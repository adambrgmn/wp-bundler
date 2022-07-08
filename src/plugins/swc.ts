import swcCore from '@swc/core';
import * as fs from 'fs/promises';

import { BundlerPlugin } from '../types';

export const swc: BundlerPlugin = () => ({
  name: 'wp-bundler-swc',
  setup(build) {
    build.onLoad({ filter: /.(js|ts|tsx|jsx)$/, namespace: '' }, async (args) => {
      const contents = await fs.readFile(args.path, 'utf-8');
      let { code } = await swcCore.transform(contents, {
        filename: args.path,
        sourceMaps: false,
        isModule: true,

        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          target: 'es5',
        },
      });

      return { contents: code };
    });
  },
});
