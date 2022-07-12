import { BuildOptions } from 'esbuild';

import { BundlerPlugin } from '../types';

export const ignoreCss: BundlerPlugin = () => {
  return {
    name: 'wp-bundler-ignore-css',
    setup(build) {
      build.initialOptions.entryPoints = removeCssEntrypoints(build.initialOptions.entryPoints);

      build.onResolve({ filter: /\.css$/, namespace: 'file' }, async () => {
        return { external: true };
      });
    },
  };
};

function removeCssEntrypoints(entryPoints: BuildOptions['entryPoints']) {
  if (entryPoints == null) return undefined;

  if (Array.isArray(entryPoints)) {
    return entryPoints.filter((entryPoint) => !entryPoint.endsWith('.css'));
  }

  let newEntryPoints: Record<string, string> = {};
  for (let [key, value] of Object.entries(entryPoints)) {
    if (!value.endsWith('.css')) {
      newEntryPoints[key] = value;
    }
  }

  return newEntryPoints;
}
