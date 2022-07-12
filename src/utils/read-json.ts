import * as fs from 'node:fs';

export function readJson<T = unknown>(path: string): T {
  let raw = fs.readFileSync(path, 'utf-8');
  let json = JSON.parse(raw);
  return json;
}
