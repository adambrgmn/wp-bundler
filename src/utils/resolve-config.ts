import { BundlerConfig, BundlerConfigSchema } from '../schema.js';
import { ProjectInfo } from '../types.js';
import { readJson } from './read-json.js';

type ConfigKey = 'package.json' | '.wp-bundlerrc' | 'wp-bundler.config.json';

export function resolveConfig(project: ProjectInfo): BundlerConfig {
  let config = _resolveConfig(project, readJson);
  return config;
}

export function _resolveConfig(project: ProjectInfo, read: (path: string) => unknown) {
  let configs: Record<ConfigKey, unknown> = {
    'package.json': project.packageJson['wp-bundler'],
    '.wp-bundlerrc': readConfigFile(project.paths.absolute('.wp-bundlerrc'), read),
    'wp-bundler.config.json': readConfigFile(project.paths.absolute('wp-bundler.config.json'), read),
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

function readConfigFile(path: string, read: (path: string) => unknown): unknown {
  try {
    let json = read(path);
    return json;
  } catch (error) {
    return undefined;
  }
}
