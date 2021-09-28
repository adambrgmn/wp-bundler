import * as path from 'path';
import { readPackageUpAsync } from 'read-pkg-up';
import { ProjectPaths, ProjectInfo } from '../types';

export async function readPkg(cwd: string): Promise<ProjectInfo> {
  let pkg = await readPackageUpAsync({ cwd });
  if (pkg == null) {
    throw new Error(`Could not read package.json related to ${cwd}.`);
  }

  return { ...pkg, paths: createPaths(pkg.path) };
}

function createPaths(pkgPath: string): ProjectPaths {
  let root = path.dirname(pkgPath);
  return {
    root,
    absolute: (...to: string[]) => path.join(root, ...to),
    relative: (to: string) => path.relative(root, to),
  };
}
