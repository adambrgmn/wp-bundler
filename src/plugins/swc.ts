import * as fs from 'node:fs/promises';

import { transform } from '@swc/core';

import { BundlerPlugin } from '../types.js';

export const swc: BundlerPlugin = () => ({
  name: 'wp-bundler-swc',
  setup(build) {
    build.onLoad({ filter: /.(js|ts|tsx|jsx)$/, namespace: '' }, async (args) => {
      const contents = await fs.readFile(args.path, 'utf-8');
      let { code } = await transform(contents, {
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
