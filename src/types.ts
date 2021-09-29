import { Plugin } from 'esbuild';
import { NormalizedReadResult } from 'read-pkg-up';
import { BundlerConfig } from './schema';

export type Mode = 'dev' | 'prod';

export interface CliOptions {
  mode: Mode;
  cwd: string;
}

export interface ProjectPaths {
  root: string;
  absolute: (...to: string[]) => string;
  relative: (to: string) => string;
}

export type ProjectInfo = NormalizedReadResult & { paths: ProjectPaths };

export interface BundlerPluginOptions {
  mode: Mode;
  config: BundlerConfig;
  project: ProjectInfo;
  bundler: ProjectInfo;
}

export type BundlerPlugin = (options: BundlerPluginOptions) => Plugin;
