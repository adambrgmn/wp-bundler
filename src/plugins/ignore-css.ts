import { BuildOptions } from 'esbuild';

import { BundlerPlugin } from '../types.js';

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

  if (isStringArray(entryPoints)) {
    return entryPoints.filter((entryPoint) => !entryPoint.endsWith('.css'));
  }

  if (Array.isArray(entryPoints)) {
    return entryPoints.filter((entryPoint) => !entryPoint.out.endsWith('.css'));
  }

  let newEntryPoints: Record<string, string> = {};
  for (let [key, value] of Object.entries(entryPoints)) {
    if (!value.endsWith('.css')) {
      newEntryPoints[key] = value;
    }
  }

  return newEntryPoints;
}

function isStringArray(arg: unknown): arg is string[] {
  return Array.isArray(arg) && typeof arg[0] === 'string';
}
