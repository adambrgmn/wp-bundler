import babelCore from '@babel/core';
import { OnLoadArgs } from 'esbuild';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BundlerPlugin } from '../types';

export const babel: BundlerPlugin = ({ mode, project }) => ({
  name: 'babel',
  setup(build) {
    const transformContents = async (args: OnLoadArgs, contents: string) => {
      let result = await babelCore.transformAsync(contents, {
        presets: [
          [
            '@babel/preset-env',
            {
              useBuiltIns: 'usage',
              corejs: '3',
              targets: 'defaults',
              ignoreBrowserslistConfig: true,
            },
          ],
          [
            '@babel/preset-react',
            { runtime: 'automatic', development: mode === 'dev' },
          ],
          '@babel/preset-typescript',
        ],

        babelrc: false,
        envName: mode === 'prod' ? 'production' : 'development',
        cwd: project.paths.root,
        filename: path.basename(args.path),
        filenameRelative: path.relative(project.path, args.path),
        sourceFileName: path.basename(args.path),
        sourceType: 'module',
      });

      return { contents: result!.code! };
    };

    build.onLoad(
      { filter: /.(js|ts|tsx|jsx)$/, namespace: '' },
      async (args) => {
        const contents = await fs.readFile(args.path, 'utf-8');
        return transformContents(args, contents);
      },
    );
  },
});
