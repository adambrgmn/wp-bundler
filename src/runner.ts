import * as fs from 'fs';
import * as path from 'path';
import { BuildFailure } from 'esbuild';
import exitHook from 'exit-hook';
import ora from 'ora';
import { codeFrameColumns } from '@babel/code-frame';
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
      let { waitUntilExit } = render(
        createElement(Build, { bundler: this.bundler, cwd: this.cwd }),
      );
      await waitUntilExit();
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }

  async watch() {
    try {
      let { waitUntilExit } = render(
        createElement(Watch, { bundler: this.bundler, cwd: this.cwd }),
      );
      await waitUntilExit();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }

  private printErrors(errors: BuildFailure['errors']) {
    for (let error of errors) {
      if (error.location == null) continue;
      let sourcePath = path.join(this.cwd, error.location.file);
      let source = fs.readFileSync(sourcePath, 'utf-8');

      let sourceLocation = {
        start: { line: error.location.line, column: error.location.column },
      };
      let frame = codeFrameColumns(source, sourceLocation, {
        highlightCode: true,
        message: error.text,
      });

      console.log(`\nError occured in ${path.relative(this.cwd, sourcePath)}.`);
      console.error(frame);
    }
  }
}

function isBuildFailure(error: unknown): error is BuildFailure {
  return error instanceof Error && 'errors' in error;
}
