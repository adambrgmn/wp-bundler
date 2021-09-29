import { Bundler } from './bundler';
import { render } from 'ink';
import { createElement } from 'react';
import { Watch } from './components/Watch';
import { Build } from './components/Build';

export class Runner {
  private bundler: Bundler;
  private cwd: string;

  constructor(bundler: Bundler, cwd: string) {
    this.bundler = bundler;
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
      let { waitUntilExit } = render(createElement(Watch, { bundler: this.bundler, cwd: this.cwd }));
      await waitUntilExit();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  }
}
