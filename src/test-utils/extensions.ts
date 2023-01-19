import { Writable } from 'node:stream';

import { Chalk } from 'chalk';
import { OutputFile } from 'esbuild';

import { Logger } from '../logger.js';
import { Writer } from '../writer.js';

export class TestWriter extends Writer {
  #writes = new Set<OutputFile[]>();

  write(outputFiles: OutputFile[]) {
    this.#writes.add(outputFiles);
  }

  getOutputFiles() {
    return [...this.#writes];
  }

  getLastOutput() {
    return this.getOutputFiles().at(-1);
  }
}

export class TestLogger extends Logger {
  #logs = new Set<string>();

  constructor(prefix: string) {
    process.env.FORCE_COLOR = '0';
    let stream = new Writable({
      write: (chunk, _, callback) => {
        this.#logs.add(chunk.toString());
        callback();
      },
    });

    let chalk = new Chalk({ level: 0 });
    super(prefix, stream, chalk);
  }

  getOutput() {
    return [...this.#logs].join('');
  }
}
