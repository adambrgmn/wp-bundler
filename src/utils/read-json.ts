import * as fs from 'node:fs';

export function readJson(path: string) {
  let raw = fs.readFileSync(path, 'utf-8');
  let json = JSON.parse(raw) as unknown;
  return json;
}
