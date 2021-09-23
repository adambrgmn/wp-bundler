import * as fs from 'fs/promises';
import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';
import { BundlerPlugin } from '../types';

const postcssPlugin: BundlerPlugin = (mode, config, paths) => ({
  name: 'wp-bundler-postcss',
  async setup(build) {
    build.initialOptions.metafile = true;
    build.onEnd(async (result) => {
      let { metafile } = result;
      if (metafile == null) {
        throw new Error('Metafile must be outputted.');
      }

      let { outputs } = metafile;
      for (let outputFile of Object.keys(outputs)) {
        if (!outputFile.match(/\.css$/)) continue;
        let outputPath = paths.absolute(outputFile);
        let content = await fs.readFile(outputPath, 'utf-8');

        let result = await postcss([postcssPresetEnv()]).process(content, {
          from: outputPath,
          to: outputPath,
        });

        await fs.writeFile(outputPath, result.css);
      }
    });

    // const tempDir = path.join(paths.temp, 'css');

    // build.onResolve(
    //   { filter: /.\.(css)$/, namespace: 'file' },
    //   async (args) => {
    //     const srcFullPath = path.resolve(args.resolveDir, args.path);
    //     const srcExt = path.extname(srcFullPath);
    //     const srcBasename = path.basename(srcFullPath, srcExt);
    //     const srcDir = path.dirname(srcFullPath);
    //     const srcRelDir = path.relative(path.dirname(paths.root), srcDir);

    //     const tmpDir = path.resolve(tempDir, srcRelDir);
    //     const tmpFilePath = path.resolve(tmpDir, `${srcBasename}.css`);
    //     await ensureDir(tmpDir);

    //     const css = await fs.readFile(srcFullPath);

    //     const result = await postcss([
    //       postcssImport(),
    //       postcssPresetEnv(),
    //     ]).process(css, {
    //       from: srcFullPath,
    //       to: tmpFilePath,
    //     });

    //     // Write result file
    //     await fs.writeFile(tmpFilePath, result.css);

    //     return { path: tmpFilePath };
    //   },
    // );

    // build.onEnd(async () => {
    //   await rimraf(tempDir);
    // });
  },
});

export { postcssPlugin as postcss };
