import * as url from 'node:url';

export function dirname(metaUrl: string) {
  const __filename = url.fileURLToPath(metaUrl);
  const __dirname = url.fileURLToPath(new URL('.', metaUrl));

  return { __dirname, __filename };
}
