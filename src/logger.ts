import * as process from 'node:process';
import * as util from 'node:util';

import chalk from 'chalk';
import { BuildResult, Metafile, OutputFile, PartialMessage } from 'esbuild';
import fileSize from 'filesize';

import { constructBundleOutput } from './utils/bundle-output';
import { figures } from './utils/figures';

export class Logger {
  #prefixValue: string;
  #target: NodeJS.WriteStream;

  chalk = chalk;

  constructor(prefix: string, target: NodeJS.WriteStream = process.stdout) {
    this.#prefixValue = prefix;
    this.#target = target;
  }

  info(message: unknown) {
    this.#write(message);
  }

  success(message: unknown) {
    this.#write(chalk.green(message), { state: 'success' });
  }

  warn(message: unknown) {
    this.#write(chalk.yellow(message), { prefix: 'WARNING' });
  }

  error(message: unknown) {
    this.#write(chalk.red(message), { prefix: 'ERROR' });
  }

  formattedMessage(kind: 'error' | 'warning', message: PartialMessage) {
    let lines = [];
    lines.push(`${this.#prefix({ prefix: kind.toUpperCase() })}${chalk.bold(message.text)}`);

    if (message.location?.file != null) {
      lines.push('');
      lines.push(`    ${[message.location.file, message.location.line, message.location.column].join(':')}:`);
    }

    if (message.location?.lineText != null) {
      let mark = chalk.green;
      let { column = 0, length = 0, line = 0, lineText } = message.location;
      let init = `      ${line} ${figures.lineVertical} `;

      let parts = [
        lineText.slice(0, column),
        mark.underline(lineText.slice(column, column + length)),
        lineText.slice(column + length),
      ];
      lines.push(`${init}${parts.join('')}`);
    }

    if (message.notes != null) {
      for (let note of message.notes) {
        // esbuild plugin notes
        if (note.text?.startsWith('The plugin "')) continue;
        lines.push('');
        lines.push(`    ${note.text}`);
      }
    }

    for (let line of lines) {
      this.raw(line);
    }
    this.raw('');
  }

  buildResult(result: Pick<BuildResult, 'errors' | 'warnings'>) {
    for (let warning of result?.warnings ?? []) {
      this.formattedMessage('warning', warning);
    }

    for (let error of result?.errors ?? []) {
      this.formattedMessage('error', error);
    }
  }

  buildOutput(metafile: Metafile, outputFiles: OutputFile[]) {
    let output = constructBundleOutput(metafile, outputFiles);
    for (let [name, part] of Object.entries(output)) {
      this.raw('\n' + this.chalk.blue(name));
      for (let { file, size } of part) {
        let sizeStr = size == null ? '' : `(${fileSize(size)})`;
        this.raw(`  ${file} ${sizeStr}`);
      }
    }

    this.raw('');
  }

  raw(message: unknown) {
    if (typeof message !== 'string') {
      message = util.inspect(message, { depth: null, colors: true });
    }

    this.#write(message, { withPrefix: false });
  }

  #write(message: unknown, { withPrefix = true, ...prefix }: WriteOptions = {}) {
    this.#target.write(`${withPrefix ? this.#prefix(prefix) : ''}${message}\n`);
  }

  #prefix({ prefix = this.#prefixValue, state = prefix }: PrefixOptions = {}) {
    let [iconColor, prefixColor] = PREFIX_COLORS[state?.toLowerCase() ?? 'default'] ?? PREFIX_COLORS.default;
    let icon = PREFIX_ICONS[state?.toLowerCase() ?? 'default'] ?? PREFIX_ICONS.default;

    return `${iconColor(icon)} ${prefixColor(` ${prefix} `)} `;
  }
}

const PREFIX_COLORS: Record<string, [icon: typeof chalk, prefix: typeof chalk]> = {
  warning: [chalk.yellowBright, chalk.black.bgYellowBright],
  error: [chalk.redBright, chalk.white.bgRedBright],
  success: [chalk.greenBright, chalk.black.bgGreenBright],
  default: [chalk.blue, chalk.black.bgBlue],
};

const PREFIX_ICONS: Record<string, string> = {
  warning: figures.triangleUp,
  error: figures.cross,
  success: figures.tick,
  default: figures.triangleRight,
};

interface PrefixOptions {
  prefix?: string | null;
  state?: string | null;
}

interface WriteOptions extends PrefixOptions {
  withPrefix?: boolean;
}
