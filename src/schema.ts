import * as z from 'zod';

export const BundlerConfigSchema = z.object({
  entryPoints: z.record(z.string()),
  outdir: z.string().default('./dist'),
  port: z.number().min(2000).default(3000),
  sourcemap: z.boolean().optional(),
});

export type BundlerConfig = z.infer<typeof BundlerConfigSchema>;

export const ManifestSchema = z.record(
  z.object({
    name: z.string(),
    js: z.string().optional(),
    css: z.string().optional(),
  }),
);

export type Manifest = z.infer<typeof ManifestSchema>;
