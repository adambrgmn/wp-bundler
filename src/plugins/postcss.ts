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

    build.onResolve({ filter: /\.css$/ }, (args) => {
      return { path: path.join(args.resolveDir, args.path), namespace: 'file', pluginName };
    });

    build.onLoad({ filter: /\.css$/, namespace: 'file' }, async (args) => {
      let contents = await fs.readFile(args.path, 'utf-8');
      let result = await processor.process(contents, { from: args.path, to: args.path });
      let warnings = transformPostcssWarnings(args.path, result.warnings());

      // There's an issue with tailwinds [focus-within] utils that this is trying to resolve
      contents = result.css.replace(/\\\[focus-within\]/g, '[focus-within]');

      return { contents, loader: 'css', pluginName, warnings, resolveDir: path.dirname(args.path) };
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
