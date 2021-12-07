import { BundlerConfig, BundlerConfigSchema } from '../schema';
import { ProjectInfo } from '../types';
import { readJson } from './read-json';

type ConfigKey = 'package.json' | '.wp-bundlerrc' | 'wp-bundler.config.json';

export async function resolveConfig(project: ProjectInfo): Promise<BundlerConfig> {
  let config = await _resolveConfig(project, readJson);
  return config;
}

export async function _resolveConfig(project: ProjectInfo, read: (path: string) => Promise<unknown>) {
  let configs: Record<ConfigKey, unknown> = {
    'package.json': project.packageJson['wp-bundler'],
    '.wp-bundlerrc': await readConfigFile(project.paths.absolute('.wp-bundlerrc'), read),
    'wp-bundler.config.json': await readConfigFile(project.paths.absolute('wp-bundler.config.json'), read),
  };

  let foundKeys = Object.keys(configs).filter((key) => configs[key as ConfigKey] != null);

  if (foundKeys.length > 1) {
    console.warn(
      `Found more than one wp-bundler configuration (${foundKeys.join(', ')}). ` +
        'It is recommended to only stick with one of the options: ' +
        'package.json["wp-bundler"], .wp-bundlerrc or wp-bundler.config.json.',
    );
  }

  let config = configs['package.json'] ?? configs['.wp-bundlerrc'] ?? configs['wp-bundler.config.json'];
  if (config == null) {
    throw new Error(
      'Could not resolve a configuration file. ' +
        'Either configure wp-bundler in your package.json, in .wp-bundlerrc or in wp-bundler.config.json.',
    );
  }

  let parsedConfig = BundlerConfigSchema.safeParse(config);
  if (parsedConfig.success) {
    return parsedConfig.data;
  }

  console.error(parsedConfig.error.toString());
  throw new Error('Something is wrong in your configuration file.');
}

async function readConfigFile(path: string, read: (path: string) => Promise<unknown>): Promise<unknown> {
  try {
    let json = await read(path);
    return json;
  } catch (error) {
    return undefined;
  }
}
