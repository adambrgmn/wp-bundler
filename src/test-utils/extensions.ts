import { Writable } from 'node:stream';

import { Chalk } from 'chalk';

import { Logger } from '../logger.js';

export class TestLogger extends Logger {
  #logs = new Set<string>();

  constructor(prefix: string) {
    process.env.FORCE_COLOR = '0';
    let stream = new Writable({
      write: (chunk: string | Buffer, _, callback) => {
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
