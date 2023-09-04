import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { PartialMessage } from 'esbuild';
import { AcceptedPlugin, Postcss, Warning, default as _postcss } from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';

import { BundlerPlugin } from '../types.js';

// Something, not sure what, is broken with the postcss types default export. Never use default exports...
const postcss = _postcss as unknown as Postcss;
export const PLUGIN_NAME = 'wp-bundler-postcss';

const postcssPlugin: BundlerPlugin = () => ({
  name: PLUGIN_NAME,
  setup(build) {
    // @ts-expect-error The env plugin lacks good types or something clashes with postcss types.
    let plugins = [postcssPresetEnv()] as AcceptedPlugin[];
    let processor = postcss(plugins);

    build.onLoad({ filter: /\.css$/, namespace: 'file' }, async (args) => {
      let contents = await fs.readFile(args.path, 'utf-8');
      let result = await processor.process(contents, { from: args.path, to: args.path });
      let warnings = transformPostcssWarnings(args.path, result.warnings());

      return {
        contents: result.content,
        loader: args.path.endsWith('.module.css') ? 'local-css' : 'css',
        pluginName: PLUGIN_NAME,
        warnings,
        resolveDir: path.dirname(args.path),
      };
    });
  },
});

export { postcssPlugin as postcss };

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
