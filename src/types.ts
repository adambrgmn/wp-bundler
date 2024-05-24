import type { Plugin } from 'esbuild';
import type { PackageJson } from 'type-fest';

import type { BundlerConfig } from './schema.js';

export type BundlerOptions = {
  config: BundlerConfig;
  project: ProjectInfo;
  bundler: ProjectInfo;
  mode: Mode;
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
