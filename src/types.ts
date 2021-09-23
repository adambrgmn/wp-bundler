import { Plugin } from 'esbuild';
import { BundlerConfig } from './schema';

export type Mode = 'dev' | 'prod';

export interface CliOptions {
  mode?: Mode;
  cwd?: string;
}

export interface ProjectPaths {
  root: string;
  temp: string;
  absolute: (...to: string[]) => string;
}

export type BundlerPlugin = (
  mode: Mode,
  config: BundlerConfig,
  paths: ProjectPaths,
) => Plugin;
