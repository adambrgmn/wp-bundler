import { Plugin } from 'esbuild';
import { PackageJson } from 'type-fest';

import { BundlerConfig } from './schema';

export type Mode = 'dev' | 'prod';

export interface ProjectPaths {
  root: string;
  absolute: (...to: string[]) => string;
  relative: (to: string) => string;
}

export type ProjectInfo = {
  packageJson: PackageJson & { 'wp-bundler'?: unknown } & Record<string, unknown>;
  path: string;
  paths: ProjectPaths;
};

export interface BundlerPluginOptions {
  mode: Mode;
  config: BundlerConfig;
  project: ProjectInfo;
  bundler: ProjectInfo;
  host: string;
  port: number;
}

export type BundlerPlugin = (options: BundlerPluginOptions) => Plugin;

export type WebSocketEvent = { type: 'reload'; files: string[] };
