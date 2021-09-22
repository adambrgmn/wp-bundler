export type Mode = 'dev' | 'prod';

export interface CliOptions {
  mode?: Mode;
  cwd?: string;
}
