import { PartialMessage } from 'esbuild';
import * as fs from 'fs/promises';
import * as path from 'path';
import postcss, { AcceptedPlugin, Warning } from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';
import { BundlerPlugin } from '../types';

const pluginName = 'wp-bundler-postcss';

const postcssPlugin: BundlerPlugin = ({ project }) => ({
  name: pluginName,
  async setup(build) {
    let plugins: AcceptedPlugin[] = [postcssPresetEnv()];
    let tailwindPath = project.paths.absolute('tailwind.config.js');
    if (await exists(tailwindPath)) {
      plugins.unshift(require('tailwindcss')(tailwindPath));
    }

    let processor = postcss(plugins);
    let namespace = 'wp-bundler-postcss';

    build.onResolve({ filter: /\.css$/ }, (args) => {
      return { path: path.join(path.dirname(args.importer), args.path), namespace, pluginName };
    });

    build.onLoad({ filter: /.*/, namespace }, async (args) => {
      let content = await fs.readFile(args.path, 'utf-8');
      let result = await processor.process(content, { from: args.path, to: args.path });
      let warnings = transformPostcssWarnings(args.path.replace(/^wp-bundler-postcss:/, ''), result.warnings());

      return { contents: result.css, loader: 'css', pluginName, warnings };
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

function transformPostcssWarnings(file: string, warnings: Warning[]): PartialMessage[] {
  return warnings.map((warn) => {
    return {
      text: warn.text,
      location: {
        file,
        namespace: '',
        line: warn.line, // 1-based
        column: warn.column, // 0-based, in bytes
        length: 0, // in bytes
        lineText: warn.node.toString(),
        suggestion: '',
      },
    };
  });
}
