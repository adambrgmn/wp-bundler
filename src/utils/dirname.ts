import * as path from 'path';
import { fileURLToPath } from 'url';

export function dirname(url: string) {
  let __filename = fileURLToPath(url);
  let __dirname = path.dirname(__filename);
  return { __filename, __dirname } as const;
}
