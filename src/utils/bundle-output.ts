import * as path from 'node:path';

import type { Metafile, OutputFile } from 'esbuild';

type BundlerOutput = Record<string, { file: string; size: number | null }[]>;

export type BundleOutputOptions = {
  metafile: Metafile;
  outputFiles: OutputFile[];
  root: string;
  entryPoints: Record<string, string>;
};

export function constructBundleOutput({ metafile, outputFiles, root, entryPoints }: BundleOutputOptions) {
  let bundles: BundlerOutput = {};

  for (let [key, output] of Object.entries(metafile.outputs)) {
    let entrypoint = getEntrypoint(output, root, entryPoints);
    if (entrypoint != null) {
      bundles[entrypoint] ??= [];
      bundles[entrypoint]?.push({ file: key, size: getSize(key, outputFiles) });

      if (output.cssBundle != null) {
        bundles[entrypoint]?.push({ file: output.cssBundle, size: getSize(output.cssBundle, outputFiles) });
      }
      continue;
    }

    let extension = path.extname(key);
    if (['.mo', '.po', '.pot'].includes(extension) || (extension === '.json' && key.includes('/languages/'))) {
      bundles.translations ??= [];
      bundles.translations.push({ file: key, size: getSize(key, outputFiles) });
      continue;
    }

    if (extension === '.php') {
      bundles['asset-loader'] = [];
      bundles['asset-loader'].push({ file: key, size: getSize(key, outputFiles) });
    }
  }

  return bundles;
}

function getEntrypoint(output: Metafile['outputs'][string], root: string, entryPoints: Record<string, string>) {
  if (output.entryPoint != null) {
    let base = new URL(`file:${root}${root.endsWith('/') ? '' : '/'}`);
    let url = new URL(output.entryPoint, base);
    let relative = path.relative(root, url.pathname);

    let name = Object.keys(entryPoints).find((entry) => entryPoints[entry]?.endsWith(relative));
    return name ?? null;
  }

  return null;
}

function getSize(key: string, outputFiles: OutputFile[]) {
  let file = outputFiles.find(({ path }) => path === key);
  return file?.contents.length ?? null;
}
