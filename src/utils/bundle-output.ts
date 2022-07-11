import * as fs from 'node:fs';
import * as path from 'node:path';

import { Metafile } from 'esbuild';

type BundlerOutput = Record<string, { file: string; size: number | null }[]>;
type BundlerOutputConfig = {
  withSize?: boolean;
  cwd: string;
};

export function constructBundleOutput(metafile: Metafile, { cwd, withSize }: BundlerOutputConfig) {
  let bundles: BundlerOutput = {};

  for (let key of Object.keys(metafile.outputs)) {
    let [filename] = key.split('/').slice(-1);
    if (!filename.endsWith('.js') && !filename.endsWith('.css')) continue;
    let [bundleName] = filename.split('.').slice(0, 1);

    let size: number | null = null;
    if (withSize) {
      let buffer = fs.readFileSync(path.join(cwd, key));
      size = buffer.length;
    }

    bundles[bundleName] = bundles[bundleName] ?? [];
    bundles[bundleName].push({ file: key, size });
  }

  return bundles;
}
