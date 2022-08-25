import { OutputFile, Plugin } from 'esbuild';
import { PackageJson } from 'type-fest';

import { BundlerConfig } from './schema';

export type BundlerOptions = {
  mode: Mode;
  watch: boolean;
  config: BundlerConfig;
  project: ProjectInfo;
  bundler: ProjectInfo;
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

export type BundlerPluginOptions = BundlerOptions & { output: Set<OutputFile> };

export type BundlerPlugin = (options: BundlerPluginOptions) => Plugin;

export type WebSocketEvent = { type: 'reload'; files: string[] };
