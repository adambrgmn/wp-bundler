import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

import { PackageJson } from 'type-fest';

import { BundlerConfig } from '../schema.js';
import { ProjectInfo, ProjectPaths } from '../types.js';
import { readJson } from './read-json.js';
import { resolveConfig } from './resolve-config.js';

interface Metadata {
  bundler: ProjectInfo;
  project: ProjectInfo;
  config: BundlerConfig;
}

const metadataCache = new Map<string, Metadata>();

export function getMetadata(projectPath: string, bundlerPath: string): Metadata {
  let cached = metadataCache.get(projectPath);
  if (cached != null) return cached;

  let [project, bundler] = [readPkg(projectPath), readPkg(bundlerPath)];
  let config = resolveConfig(project);

  let metadata = { bundler, project, config };
  metadataCache.set(projectPath, metadata);
  return metadata;
}

export function readPkg(cwd: string): ProjectInfo {
  let pkg = readPkgUp(cwd);
  if (pkg == null) {
    throw new Error(`Could not read package.json related to ${cwd}.`);
  }

  return { ...pkg, paths: createPaths(pkg.path) };
}

interface ReadResult {
  path: string;
  packageJson: PackageJson & Record<string, unknown>;
}

export function readPkgUp(cwd: string = process.cwd()): ReadResult | null {
  if (cwd === '/') return null;
  let items = fs.readdirSync(cwd);

  for (let item of items) {
    if (item === 'package.json') {
      let pkgPath = path.join(cwd, item);
      let packageJson = readJson<ProjectInfo['packageJson']>(pkgPath);

      return { path: pkgPath, packageJson };
    }
  }

  return readPkgUp(path.dirname(cwd));
}

export function createPaths(pkgPath: string): ProjectPaths {
  let root = path.dirname(pkgPath);
  return {
    root,
    absolute: (...to: string[]) => path.join(root, ...to),
    relative: (to: string) => path.relative(root, path.isAbsolute(to) ? to : path.join(root, to)),
  };
}
