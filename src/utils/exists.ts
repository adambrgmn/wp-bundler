import { accessSync } from 'node:fs';
import * as fs from 'node:fs/promises';

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch (error) {
    return false;
  }
}

export function existsSync(p: string): boolean {
  try {
    accessSync(p);
    return true;
  } catch (error) {
    return false;
  }
}
