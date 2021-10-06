import { build } from 'esbuild';
import * as fs from 'fs/promises';

const args = process.argv.slice(2);

(async () => {
  const pkg = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
  const watch = args.includes('--watch') || args.includes('-w');
  let external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

  try {
    await build({
      entryPoints: ['./src/index.ts'],
      bundle: true,
      format: 'cjs',
      outdir: './dist',
      platform: 'node',
      target: 'node12',
      sourcemap: true,
      external,
      watch: watch
        ? {
            onRebuild(error) {
              if (error == null) {
                console.log('Rebuild succeeded.');
              } else {
                console.error('Rebuild failed.');
              }
            },
          }
        : false,
    });

    if (watch) {
      console.log('Initial build done.');
    } else {
      console.log('Build completed.');
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
