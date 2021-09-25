import * as fs from 'fs/promises';
import postcss, { AcceptedPlugin } from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';
import postcssTailwind from 'tailwindcss';
import { BundlerPlugin } from '../types';

const postcssPlugin: BundlerPlugin = ({ project }) => ({
  name: 'wp-bundler-postcss',
  async setup(build) {
    build.initialOptions.metafile = true;
    build.onEnd(async ({ metafile = { outputs: {} } }) => {
      let { outputs } = metafile;
      for (let outputFile of Object.keys(outputs)) {
        if (!outputFile.match(/\.css$/)) continue;
        let outputPath = project.paths.absolute(outputFile);
        let content = await fs.readFile(outputPath, 'utf-8');

        let plugins: AcceptedPlugin[] = [postcssPresetEnv()];
        let tailwindPath = project.paths.absolute('tailwind.config.js');
        if (await exists(tailwindPath)) {
          plugins.unshift(postcssTailwind(tailwindPath));
        }

        let result = await postcss(plugins).process(content, {
          from: outputPath,
          to: outputPath,
        });

        await fs.writeFile(outputPath, result.css);
      }
    });
  },
});

export { postcssPlugin as postcss };

async function exists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch (error) {
    return false;
  }
}
