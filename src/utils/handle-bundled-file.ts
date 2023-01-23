import * as fs from 'node:fs';
import * as path from 'node:path';

import { BuildOptions, BuildResult } from 'esbuild';

import { BundlerOptions } from '../types.js';

export function createFileHandler<Opts extends BuildOptions>(result: BuildResult<Opts>, options: BundlerOptions) {
  function append(output: { path: string; contents: Uint8Array | Buffer | string }) {
    let absolute = options.project.paths.absolute(output.path);
    let relative = options.project.paths.relative(output.path);

    let contents = typeof output.contents === 'string' ? Buffer.from(output.contents, 'utf-8') : output.contents;
    let text = typeof output.contents === 'string' ? output.contents : output.contents.toString('utf-8');

    if (result.outputFiles != null) {
      result.outputFiles.push({ path: absolute, contents, text });
    } else {
      ensureDir(absolute);
      fs.writeFileSync(absolute, contents, 'utf-8');
    }

    if (result.metafile != null) {
      result.metafile.outputs[relative] = {
        bytes: Buffer.from(text, 'utf-8').byteLength,
        exports: [],
        imports: [],
        inputs: {},
      };
    }
  }

  return { append } as const;
}

function ensureDir(file: string) {
  try {
    let dirname = path.dirname(file);
    fs.mkdirSync(dirname, { recursive: true });
  } catch (error) {}
}
