import * as process from 'node:process';
import { Writable } from 'node:stream';
import * as util from 'node:util';

import { type ChalkInstance, default as chalkDefault } from 'chalk';
import type { BuildResult, PartialMessage } from 'esbuild';
import { filesize } from 'filesize';

import { type BundleOutputOptions, constructBundleOutput } from './utils/bundle-output.js';
import { figures } from './utils/figures.js';

export class Logger {
  #prefixValue: string;
  #target: Writable;

  chalk: ChalkInstance;

  #prefixColors: {
    warning: [icon: typeof chalkDefault, prefix: typeof chalkDefault];
    error: [icon: typeof chalkDefault, prefix: typeof chalkDefault];
    success: [icon: typeof chalkDefault, prefix: typeof chalkDefault];
    default: [icon: typeof chalkDefault, prefix: typeof chalkDefault];
  };

  constructor(prefix: string, target: Writable = process.stdout, chalk: ChalkInstance = chalkDefault) {
    this.#prefixValue = prefix;
    this.#target = target;
    this.chalk = chalk;

    this.#prefixColors = {
      warning: [chalk.yellowBright, chalk.black.bgYellowBright],
      error: [chalk.redBright, chalk.white.bgRedBright],
      success: [chalk.greenBright, chalk.black.bgGreenBright],
      default: [chalk.blue, chalk.black.bgBlue],
    };
  }

  info(message: unknown) {
    this.#write(message);
  }

  success(message: unknown) {
    this.#write(this.chalk.green(message), { state: 'success' });
  }

  warn(message: unknown) {
    this.#write(this.chalk.yellow(message), { prefix: 'WARNING' });
  }

  error(message: unknown) {
    this.#write(this.chalk.red(message), { prefix: 'ERROR' });
  }

  formattedMessage(kind: 'error' | 'warning', message: PartialMessage) {
    let lines = [];
    lines.push(`${this.#prefix({ prefix: kind.toUpperCase() })}${this.chalk.bold(message.text)}`);

    if (message.location?.file != null) {
      lines.push('');
      lines.push(`    ${[message.location.file, message.location.line, message.location.column].join(':')}:`);
    }

    if (message.location?.lineText != null) {
      let mark = this.chalk.green;
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

  buildOutput(options: BundleOutputOptions) {
    let output = constructBundleOutput(options);
    for (let [name, part] of Object.entries(output)) {
      this.raw('\n' + this.chalk.blue(name));
      for (let { file, size } of part) {
        let sizeStr = size == null ? '' : `(${filesize(size)})`;
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
    let parsedMessage = isStringifiable(message) ? message.toString() : JSON.stringify(message);
    this.#target.write(`${withPrefix ? this.#prefix(prefix) : ''}${parsedMessage}\n`);
  }

  #prefix({ prefix = this.#prefixValue, state = prefix }: PrefixOptions = {}) {
    let key = (state?.toLowerCase() ?? 'default') as keyof typeof PREFIX_ICONS;
    let [iconColor, prefixColor] = this.#prefixColors[key] ?? this.#prefixColors.default;
    let icon = PREFIX_ICONS[key] ?? PREFIX_ICONS.default;

    return `${iconColor(icon)} ${prefixColor(` ${prefix} `)} `;
  }
}

function isStringifiable(value: unknown): value is { toString(): string } {
  return value != null && typeof value.toString === 'function';
}

const PREFIX_ICONS = {
  warning: figures.triangleUp,
  error: figures.cross,
  success: figures.tick,
  default: figures.triangleRight,
} as const;

interface PrefixOptions {
  prefix?: string | null;
  state?: string | null;
}

interface WriteOptions extends PrefixOptions {
  withPrefix?: boolean;
}
