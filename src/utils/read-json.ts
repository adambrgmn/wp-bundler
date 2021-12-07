import * as fs from 'fs/promises';

export async function readJson(path: string) {
  let raw = await fs.readFile(path, 'utf-8');
  let json = JSON.parse(raw);
  return json;
}
