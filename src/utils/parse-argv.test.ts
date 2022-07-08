import * as z from 'zod';

import { parseArgv } from './parse-argv';

it('parses process.argv and gives back validated arguments', () => {
  let schema = z.object({
    mode: z.union([z.literal('dev'), z.literal('prod')]),
    cwd: z.string().default('cwd'),
    optional: z.string().optional(),
    count: z.number(),
  });

  let argv = ['--mode=dev', '--count', '1'];
  let parsed = parseArgv({ argv, schema });

  expect(parsed).toEqual({
    mode: 'dev',
    cwd: 'cwd',
    optional: undefined,
    count: 1,
  });
});

it('respects aliased arguments', () => {
  let schema = z.object({
    mode: z.union([z.literal('dev'), z.literal('prod')]),
    count: z.number(),
  });

  let argv = ['-m=dev', '--c', '1'];
  let parsed = parseArgv({ argv, schema, alias: { mode: 'm', count: 'c' } });

  expect(parsed).toEqual({
    mode: 'dev',
    count: 1,
  });
});
