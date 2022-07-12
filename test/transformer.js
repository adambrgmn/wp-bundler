const path = require('node:path');
const esbuild = require('esbuild');

const loaders = {
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx',
};

function createTransformer() {
  return {
    process(content, filename) {
      let loader = loaders[path.extname(filename)] ?? 'ts';
      let result = esbuild.transformSync(content, {
        loader,
        format: 'cjs',
        target: 'node12',
        sourcemap: true,
        sourcesContent: false,
        sourcefile: filename,
      });

      let map = { ...JSON.parse(result.map), sourcesContent: null };
      let code =
        result.code +
        '\n//# sourceMappingURL=data:application/json;base64,' +
        Buffer.from(JSON.stringify(map)).toString('base64');

      return { code, map };
    },
  };
}

const transformer = { canInstrument: true, createTransformer };
module.exports = transformer;
