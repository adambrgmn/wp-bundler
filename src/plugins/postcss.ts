import * as fs from 'fs/promises';
import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';
import { BundlerPlugin } from '../types';

const postcssPlugin: BundlerPlugin = ({ project }) => ({
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
        let outputPath = project.paths.absolute(outputFile);
        let content = await fs.readFile(outputPath, 'utf-8');

        let result = await postcss([postcssPresetEnv()]).process(content, {
          from: outputPath,
          to: outputPath,
        });

        await fs.writeFile(outputPath, result.css);
      }
    });
  },
});

export { postcssPlugin as postcss };
