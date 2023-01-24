import * as fs from 'node:fs';
import * as path from 'node:path';

import type { BuildOptions, BuildResult, OutputFile } from 'esbuild';

import type { ProjectInfo } from '../types.js';

export function createFileHandler<Opts extends BuildOptions>(result: BuildResult<Opts>, project: ProjectInfo) {
  function append(output: { path: string; contents: Uint8Array | Buffer | string }) {
    let absolute = project.paths.absolute(output.path);
    let relative = project.paths.relative(output.path);

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

  function items(): OutputFile[] {
    if (result.outputFiles) {
      return result.outputFiles;
    }

    if (result.metafile?.outputs != null) {
      return Object.keys(result.metafile.outputs).map((path) => {
        return {
          path,
          get contents() {
            return fs.readFileSync(project.paths.absolute(path));
          },
          set contents(next) {
            fs.writeFileSync(project.paths.absolute(path), next);
          },
          get text() {
            return fs.readFileSync(project.paths.absolute(path), 'utf-8');
          },
          set text(next) {
            fs.writeFileSync(project.paths.absolute(path), next, 'utf-8');
          },
        };
      });
    }

    return [];
  }

  return { append, items } as const;
}

function ensureDir(file: string) {
  try {
    let dirname = path.dirname(file);
    fs.mkdirSync(dirname, { recursive: true });
  } catch (error) {}
}
