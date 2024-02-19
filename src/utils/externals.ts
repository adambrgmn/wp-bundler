import { Metafile } from 'esbuild';

interface Dependencies {
  [key: string]: { wpId: string; global: string } | undefined;
}

const DEPENDENCIES: Dependencies = {
  react: { wpId: 'wp-element', global: 'React' },
  'react-dom': { wpId: 'wp-element', global: 'ReactDOM' },
  jquery: { wpId: 'jquery', global: '$' },
  lodash: { wpId: 'lodash', global: '_' },
};

export const DEFAULT_EXTERNALS = Object.entries(DEPENDENCIES).reduce<Record<string, string>>((acc, [key, dep]) => {
  if (dep) acc[key] = dep.global;
  return acc;
}, {});

export function findBuiltinDependencies(inputs: Metafile['outputs'][string]['inputs']): string[] {
  let dependencies: string[] = [];

  for (let key of Object.keys(inputs)) {
    /**
     * External packages handled by the `externals` plugin prefix all external
     * dependecies with something similar to `_wp-bundler-externals:{pkg}`. By
     * trimming that prefix we can find the expected built in dependency
     */
    let importedPkg = key.split(':').slice(-1)[0];
    let dep = DEPENDENCIES[importedPkg]?.wpId;
    if (dep == null) dep = getWPHandle(importedPkg);
    if (dep != null) dependencies.push(dep);
  }

  return dependencies;
}

function getWPHandle(pkg: string): string | undefined {
  if (!pkg.startsWith('@wordpress/')) return undefined;
  return `wp-${pkg.replace('@wordpress/', '')}`;
}
