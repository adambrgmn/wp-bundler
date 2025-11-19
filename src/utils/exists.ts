import { accessSync } from 'node:fs';

export function existsSync(p: string): boolean {
  try {
    accessSync(p);
    return true;
  } catch {
    return false;
  }
}
