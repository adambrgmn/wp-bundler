import * as fs from 'node:fs';
import * as path from 'node:path';

import type { BuildOptions, BuildResult } from 'esbuild';
import { stringToUint8Array, uint8ArrayToString } from 'uint8array-extras';

import type { ProjectInfo } from '../types.js';

export function createFileHandler<Opts extends BuildOptions>(result: BuildResult<Opts>, project: ProjectInfo) {
  function append(output: { path: string; contents: Uint8Array | string }) {
    let absolute = project.paths.absolute(output.path);
    let relative = project.paths.relative(output.path);

    let contents = typeof output.contents === 'string' ? stringToUint8Array(output.contents) : output.contents;
    let text = typeof output.contents === 'string' ? output.contents : uint8ArrayToString(output.contents, 'utf-8');

    if (result.outputFiles != null) {
      result.outputFiles.push({ path: absolute, contents, text, hash: '' });
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
  } catch {}
}
