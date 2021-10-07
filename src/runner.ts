import { Bundler } from './bundler';
import { render } from 'ink';
import { createElement } from 'react';
import { Watch } from './components/Watch';
import { Build } from './components/Build';
import { Server } from './server';

interface RunnerOptions {
  bundler: Bundler;
  server: Server;
  cwd: string;
}

export class Runner {
  private bundler: Bundler;
  private server: Server;
  private cwd: string;

  constructor({ bundler, server, cwd }: RunnerOptions) {
    this.bundler = bundler;
    this.server = server;
    this.cwd = cwd;
  }

  async build() {
    try {
      let { waitUntilExit } = render(createElement(Build, { bundler: this.bundler, cwd: this.cwd }));
      await waitUntilExit();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  }

  async watch() {
    try {
      let { waitUntilExit } = render(
        createElement(Watch, { bundler: this.bundler, server: this.server, cwd: this.cwd }),
      );
      await waitUntilExit();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  }
}
