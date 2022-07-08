import * as fs from 'fs/promises';

import { exists } from './exists';

export async function rimraf(path: string) {
  if (await exists(path)) {
    await fs.rm(path, { recursive: true });
  }
}
