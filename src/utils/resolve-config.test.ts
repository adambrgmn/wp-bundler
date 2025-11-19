import merge from 'lodash.merge';
import type { JsonValue } from 'type-fest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectInfo } from '../types.js';
import { createPaths } from './read-pkg.js';
import { _resolveConfig } from './resolve-config.js';

const readJson = vi.fn<(path: string) => JsonValue | undefined>();
const resolveConfig = (project: ProjectInfo) => _resolveConfig(project, readJson);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('resolveConfig()', () => {
  it('resolves configuration from package.json', () => {
    let project = createPackageInfo({ packageJson: { 'wp-bundler': { entryPoints: { entry: './src/index.ts' } } } });
    let configuration = resolveConfig(project);
    expect(configuration).toHaveProperty('entryPoints', { entry: './src/index.ts' });
  });

  it('resolves configuration from .wp-bundlerrc', () => {
    readJson.mockImplementation((path) => {
      if (path === '/project/.wp-bundlerrc') {
        return { entryPoints: { entry: './src/index.ts' } };
      } else {
        return undefined;
      }
    });

    let project = createPackageInfo({ packageJson: {} });
    let configuration = resolveConfig(project);
    expect(configuration).toHaveProperty('entryPoints', { entry: './src/index.ts' });
  });

  it('resolves configuration from wp-bundler.config.json', () => {
    readJson.mockImplementation((path) => {
      if (path === '/project/wp-bundler.config.json') {
        return { entryPoints: { entry: './src/index.ts' } };
      } else {
        return undefined;
      }
    });

    let project = createPackageInfo({ packageJson: {} });
    let configuration = resolveConfig(project);
    expect(configuration).toHaveProperty('entryPoints', { entry: './src/index.ts' });
  });

  it('will log a warning if more than one way of config is found', () => {
    readJson.mockImplementation((path) => {
      if (path === '/project/.wp-bundlerrc') {
        return { entryPoints: { entry: './src/index.ts' } };
      } else {
        return undefined;
      }
    });

    let spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let project = createPackageInfo({ packageJson: { 'wp-bundler': { entryPoints: { entry: './src/index.ts' } } } });
    resolveConfig(project);

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls.at(0)?.at(0)).toMatchInlineSnapshot(
      `"Found more than one wp-bundler configuration (package.json, .wp-bundlerrc). It is recommended to only stick with one of the options: package.json["wp-bundler"], .wp-bundlerrc or wp-bundler.config.json."`,
    );
  });

  it('will throw an error if no proper configuration was found', () => {
    let project = createPackageInfo({ packageJson: {} });
    expect(() => resolveConfig(project)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Could not resolve a configuration file. Either configure wp-bundler in your package.json, in .wp-bundlerrc or in wp-bundler.config.json.]`,
    );
  });

  it('will throw an error if the resolved configuration does not match the expected schema', () => {
    let spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let project = createPackageInfo({ packageJson: { 'wp-bundler': { entryPoints: { entry: 1 } } } });
    expect(() => resolveConfig(project)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Something is wrong in your configuration file.]`,
    );

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls.at(0)?.at(0)).toMatchInlineSnapshot(`
      "[
        {
          "expected": "string",
          "code": "invalid_type",
          "path": [
            "entryPoints",
            "entry"
          ],
          "message": "Invalid input: expected string, received number"
        }
      ]"
    `);
  });
});

function createPackageInfo(override: Partial<ProjectInfo> = {}): ProjectInfo {
  return merge(
    {
      packageJson: {},
      path: '/project/package.json',
      paths: createPaths('/project/package.json'),
    },
    override,
  );
}
