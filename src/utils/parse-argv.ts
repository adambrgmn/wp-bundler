import { ZodSchema } from 'zod';
import parse from 'yargs-parser';

type BaseArg = string | number | boolean | undefined;

interface ParseArgvOptions<Args extends Record<string, BaseArg>> {
  argv: string[];
  schema: ZodSchema<Args>;
  alias?: Partial<Record<keyof Args, string>>;
}

export function parseArgv<Args extends Record<string, BaseArg>>({
  argv,
  schema,
  alias = {},
}: ParseArgvOptions<Args>): Args {
  let { _, $0, ...rawArgs } = parse(argv, { alias: alias as any });
  return schema.parse(rawArgs);
}
