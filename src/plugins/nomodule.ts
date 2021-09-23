import * as fs from 'fs/promises';
import * as path from 'path';
import babel from '@babel/core';
import esbuild from 'esbuild';
import { BundlerPlugin } from '../types';

export const nomodule: BundlerPlugin = ({ mode, project }) => ({
  name: 'wp-bundler-nomodule',
  setup(build) {
    build.initialOptions.metafile = true;
    build.onEnd(async ({ metafile = { outputs: {} } }) => {
      let { outputs } = metafile;
      for (let outputFile of Object.keys(outputs)) {
        if (!outputFile.match(/\.js$/)) continue;
        let outputPath = project.paths.absolute(outputFile);
        let content = await fs.readFile(outputPath, 'utf-8');

        let nomodulePath = outputPath.replace(/\.js$/, '.nomodule.js');

        let result = await babel.transformAsync(content, {
          presets: [
            [
              '@babel/preset-env',
              { useBuiltIns: 'usage', corejs: '3', targets: 'defaults' },
            ],
          ],

          babelrc: false,
          envName: mode === 'prod' ? 'production' : 'development',
          cwd: project.paths.root,
          filename: path.basename(nomodulePath),
          filenameRelative: nomodulePath,
          sourceFileName: path.basename(outputFile),
          sourceType: 'module',
        });

        if (result == null || result.code == null) {
          throw new Error('Failed to compile code with babel');
        }

        await fs.writeFile(
          outputPath.replace(/\.js$/, '.nomodule.js'),
          result.code,
        );

        await esbuild.build({
          entryPoints: [nomodulePath],
          outfile: nomodulePath,
          bundle: true,
          allowOverwrite: true,
          minify: mode === 'prod',
        });
      }
    });
  },
});
