import { build } from 'esbuild';
import * as fs from 'fs/promises';

const args = process.argv.slice(2);

(async () => {
  try {
    const pkg = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
    const watch = args.includes('--watch') || args.includes('-w');
    let external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

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
                console.log('Rebuild server succeeded.');
              } else {
                console.error('Rebuild server failed.');
              }
            },
          }
        : false,
    });

    await build({
      entryPoints: ['./src/dev-client.ts'],
      bundle: true,
      format: 'esm',
      outdir: './dist',
      platform: 'browser',
      sourcemap: false,
      watch: watch
        ? {
            onRebuild(error) {
              if (error == null) {
                console.log('Rebuild client succeeded.');
              } else {
                console.error('Rebuild client failed.');
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
