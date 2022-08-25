import * as fs from 'node:fs';
import * as path from 'node:path';

import { OutputFile } from 'esbuild';

import { BundlerOptions, ProjectInfo } from './types';

export class Writer {
  #project: ProjectInfo = {} as unknown as any;

  constructor({ project }: BundlerOptions) {
    this.#project = project;
  }

  write(outputFiles: OutputFile[]) {
    for (let file of outputFiles) {
      let filePath = this.#project.paths.absolute(file.path);
      ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, file.contents);
    }
  }
}

function ensureDir(dir: string) {
  try {
    let stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
