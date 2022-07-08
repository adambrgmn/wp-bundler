import merge from 'lodash.merge';

import { ProjectInfo } from '../types';
import { createPaths } from './read-pkg';
import { _resolveConfig } from './resolve-config';

const readJson = jest.fn<Promise<unknown>, [string]>();
const resolveConfig = (project: ProjectInfo) => _resolveConfig(project, readJson);

beforeEach(() => {
  jest.resetAllMocks();
});

describe('resolveConfig()', () => {
  it('resolves configuration from package.json', async () => {
    let project = createPackageInfo({ packageJson: { 'wp-bundler': { entryPoints: { entry: './src/index.ts' } } } });
    let configuration = await resolveConfig(project);
    expect(configuration).toHaveProperty('entryPoints', { entry: './src/index.ts' });
  });

  it('resolves configuration from .wp-bundlerrc', async () => {
    readJson.mockImplementation((path) => {
      if (path === '/project/.wp-bundlerrc') {
        return Promise.resolve({ entryPoints: { entry: './src/index.ts' } });
      } else {
        return Promise.resolve(undefined);
      }
    });

    let project = createPackageInfo({ packageJson: {} });
    let configuration = await resolveConfig(project);
    expect(configuration).toHaveProperty('entryPoints', { entry: './src/index.ts' });
  });

  it('resolves configuration from wp-bundler.config.json', async () => {
    readJson.mockImplementation((path) => {
      if (path === '/project/wp-bundler.config.json') {
        return Promise.resolve({ entryPoints: { entry: './src/index.ts' } });
      } else {
        return Promise.resolve(undefined);
      }
    });

    let project = createPackageInfo({ packageJson: {} });
    let configuration = await resolveConfig(project);
    expect(configuration).toHaveProperty('entryPoints', { entry: './src/index.ts' });
  });

  it('will log a warning if more than one way of config is found', async () => {
    readJson.mockImplementation((path) => {
      if (path === '/project/.wp-bundlerrc') {
        return Promise.resolve({ entryPoints: { entry: './src/index.ts' } });
      } else {
        return Promise.resolve(undefined);
      }
    });

    let spy = jest.spyOn(console, 'warn').mockImplementation();

    let project = createPackageInfo({ packageJson: { 'wp-bundler': { entryPoints: { entry: './src/index.ts' } } } });
    await resolveConfig(project);

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(
      `"Found more than one wp-bundler configuration (package.json, .wp-bundlerrc). It is recommended to only stick with one of the options: package.json[\\"wp-bundler\\"], .wp-bundlerrc or wp-bundler.config.json."`,
    );
  });

  it('will throw an error if no proper configuration was found', async () => {
    let project = createPackageInfo({ packageJson: {} });
    await expect(() => resolveConfig(project)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Could not resolve a configuration file. Either configure wp-bundler in your package.json, in .wp-bundlerrc or in wp-bundler.config.json."`,
    );
  });

  it('will throw an error if the resolved configuration does not match the expected schema', async () => {
    let spy = jest.spyOn(console, 'error').mockImplementation();

    let project = createPackageInfo({ packageJson: { 'wp-bundler': { entryPoints: { entry: 1 } } } });
    await expect(() => resolveConfig(project)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Something is wrong in your configuration file."`,
    );

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "[
        {
          \\"code\\": \\"invalid_type\\",
          \\"expected\\": \\"string\\",
          \\"received\\": \\"number\\",
          \\"path\\": [
            \\"entryPoints\\",
            \\"entry\\"
          ],
          \\"message\\": \\"Expected string, received number\\"
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
