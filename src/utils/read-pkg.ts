import * as fs from 'fs/promises';
import * as path from 'path';
import { PackageJson } from 'type-fest';
import { BundlerConfig, BundlerConfigSchema } from '../schema';
import { ProjectPaths, ProjectInfo } from '../types';

interface Metadata {
  bundler: ProjectInfo;
  project: ProjectInfo;
  config: BundlerConfig;
}

const metadataCache = new Map<string, Metadata>();

export async function getMetadata(projectPath: string, bundlerPath: string): Promise<Metadata> {
  let cached = metadataCache.get(projectPath);
  if (cached != null) return cached;

  let [project, bundler] = await Promise.all([readPkg(projectPath), readPkg(bundlerPath)]);
  let config = await BundlerConfigSchema.parseAsync(project.packageJson['wp-bundler']);

  let metadata = { bundler, project, config };
  metadataCache.set(projectPath, metadata);
  return metadata;
}

export async function readPkg(cwd: string): Promise<ProjectInfo> {
  let pkg = await readPkgUp(cwd);
  if (pkg == null) {
    throw new Error(`Could not read package.json related to ${cwd}.`);
  }

  return { ...pkg, paths: createPaths(pkg.path) };
}

interface ReadResult {
  path: string;
  packageJson: PackageJson & Record<string, unknown>;
}

export async function readPkgUp(cwd: string = process.cwd()): Promise<ReadResult | null> {
  if (cwd === '/') return null;
  let items = await fs.readdir(cwd);

  for (let item of items) {
    if (item === 'package.json') {
      let pkgPath = path.join(cwd, item);
      let raw = await fs.readFile(pkgPath, 'utf-8');
      let packageJson = JSON.parse(raw);

      return { path: pkgPath, packageJson };
    }
  }

  return readPkgUp(path.dirname(cwd));
}

function createPaths(pkgPath: string): ProjectPaths {
  let root = path.dirname(pkgPath);
  return {
    root,
    absolute: (...to: string[]) => path.join(root, ...to),
    relative: (to: string) => path.relative(root, to),
  };
}
