import { accessSync } from 'node:fs';

export function existsSync(p: string): boolean {
  try {
    accessSync(p);
    return true;
  } catch (error) {
    return false;
  }
}
