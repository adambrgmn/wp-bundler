import { build } from 'esbuild';
import * as fs from 'fs/promises';

const args = process.argv.slice(2);

(async () => {
  const pkg = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
  try {
    await build({
      entryPoints: ['./src/index.ts'],
      bundle: true,
      format: 'esm',
      outdir: './dist',
      platform: 'node',
      target: 'node14',
      external: Object.keys(pkg.dependencies),
      watch:
        args.includes('--watch') || args.includes('-w')
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
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
