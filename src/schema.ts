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
      pos: z.array(z.string()),
    })
    .optional(),
});

export type BundlerConfig = z.infer<typeof BundlerConfigSchema>;
