import * as fs from 'node:fs';

import { existsSync } from './exists.js';

export function rimraf(path: string) {
  if (existsSync(path)) {
    fs.rmSync(path, { recursive: true });
  }
}
