import * as fs from 'fs';

import { existsSync } from './exists';

export function rimraf(path: string) {
  if (existsSync(path)) {
    fs.rmSync(path, { recursive: true });
  }
}
