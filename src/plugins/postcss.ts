import * as fs from 'fs/promises';
import postcss, { AcceptedPlugin } from 'postcss';
import esbuild from 'esbuild';
import postcssPresetEnv from 'postcss-preset-env';
import { BundlerPlugin } from '../types';

const postcssPlugin: BundlerPlugin = ({ project }) => ({
  name: 'wp-bundler-postcss',
  async setup(build) {
    build.initialOptions.metafile = true;
    let minify = build.initialOptions.minify ?? false;

    build.onEnd(async ({ metafile = { outputs: {} } }) => {
      let { outputs } = metafile;
      for (let outputFile of Object.keys(outputs)) {
        if (!outputFile.match(/\.css$/)) continue;
        let outputPath = project.paths.absolute(outputFile);
        let content = await fs.readFile(outputPath, 'utf-8');

        let plugins: AcceptedPlugin[] = [postcssPresetEnv()];
        let tailwindPath = project.paths.absolute('tailwind.config.js');
        if ((await exists(tailwindPath)) && content.includes('@tailwind')) {
          plugins.unshift(require('tailwindcss')(tailwindPath));
        }

        let result = await postcss(plugins).process(content, {
          from: outputPath,
          to: outputPath,
        });

        let minified = result.css;
        if (minify) {
          let { code } = await esbuild.transform(minified, { loader: 'css', minify: true });
          minified = code;
        }

        await fs.writeFile(outputPath, minified);
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
