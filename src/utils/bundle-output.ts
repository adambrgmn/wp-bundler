import { Metafile, OutputFile } from 'esbuild';

type BundlerOutput = Record<string, { file: string; size: number | null }[]>;

export function constructBundleOutput(metafile: Metafile, outputFiles: OutputFile[]) {
  let bundles: BundlerOutput = {};
  for (let key of Object.keys(metafile.outputs)) {
    let [filename] = key.split('/').slice(-1);

    let [bundleName] = filename.split('.').slice(0, 1);

    let output = outputFiles.find(({ path }) => path === key);
    let size = output?.contents.length ?? null;

    bundles[bundleName] = bundles[bundleName] ?? [];
    bundles[bundleName].push({ file: key, size });
  }

  return bundles;
}
