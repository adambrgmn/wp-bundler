import * as z from 'zod';

export const BundlerConfigSchema = z.object({
  entryPoints: z.record(z.string()),
  outdir: z.string().default('./dist'),
  sourcemap: z.boolean().optional(),
  externals: z.record(z.string()).optional(),
  assetLoader: z
    .object({
      path: z.string().default('./AssetLoader.php'),
      namespace: z.string().default('WPBundler'),
    })
    .default({}),
  translations: z
    .object({
      domain: z.string(),
      pot: z.string(),
      pos: z.array(z.string()).optional(),
    })
    .optional(),
});

export type BundlerConfig = z.infer<typeof BundlerConfigSchema>;

export const CliArgsSchema = z.object({
  help: z.boolean().optional(),
  version: z.boolean().optional(),
  watch: z.boolean().optional(),
  mode: z.union([z.literal('dev'), z.literal('prod')]).optional(),
  cwd: z.string().optional(),
});

export type CliArgs = z.infer<typeof CliArgsSchema>;
