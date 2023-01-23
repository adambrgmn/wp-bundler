import { Plugin } from 'esbuild';
import { PackageJson } from 'type-fest';

import { BundlerConfig } from './schema.js';

export type BundlerOptions = {
  config: BundlerConfig;
  project: ProjectInfo;
  bundler: ProjectInfo;
  mode: Mode;
  /**
   * @deprecated do not use. Check mode instead
   */
  watch: boolean;
  host: string;
  port: number;
};

export type Mode = 'dev' | 'prod';

export type ProjectPaths = {
  root: string;
  absolute: (...to: string[]) => string;
  relative: (to: string) => string;
};

export type ProjectInfo = {
  packageJson: PackageJson & { 'wp-bundler'?: unknown } & Record<string, unknown>;
  path: string;
  paths: ProjectPaths;
};

export type BundlerPlugin = (options: BundlerOptions) => Plugin;

export type WebSocketEvent = { type: 'reload'; files: string[] };
