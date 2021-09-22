import * as z from 'zod';

export const BundlerConfigSchema = z.object({
  entryPoints: z.union([z.array(z.string()), z.record(z.string())]),
  outdir: z.string().default('./dist'),
  port: z.number().min(2000).default(3000),
  sourcemap: z.boolean().default(true),
});

export type BundlerConfig = z.infer<typeof BundlerConfigSchema>;
