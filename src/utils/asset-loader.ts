import { readFileSync } from 'node:fs';
import * as path from 'node:path';

import type { Metafile } from 'esbuild';
import { slugify } from 'strman';

import type { BundlerConfig } from '../schema.js';
import type { BundlerOptions, Mode, ProjectInfo } from '../types.js';
import { findBuiltinDependencies } from './externals.js';

interface Asset {
  js?: string | undefined;
  nomodule?: string | undefined;
  css?: string | undefined;
  deps: string[];
}

type AssetsRecord = Record<string, Asset>;

interface TemplateCompileOptions {
  metafile: Pick<Metafile, 'outputs'>;
  config: BundlerConfig;
  bundler: ProjectInfo;
  project: ProjectInfo;
  mode: Mode;
  client: string;
  host: string;
  port: number;
}

export function createAssetLoaderTemplate({ config, bundler, project, mode, host, port }: BundlerOptions) {
  let templatePath = bundler.paths.absolute('./assets/AssetLoader.php');
  let compile = createTemplate(readFileSync(templatePath, 'utf-8'));
  let client = readFileSync(bundler.paths.absolute('dist/dev-client.js'), 'utf-8');

  return ({ metafile }: Pick<TemplateCompileOptions, 'metafile'>) => {
    return compile({ metafile, config, bundler, project, mode, client, host, port });
  };
}

function createTemplate(content: string) {
  return function compile({ metafile, config, bundler, project, mode, client, host, port }: TemplateCompileOptions) {
    let assetsArray = toPhpArray(metafileToAssets(metafile, config.entryPoints));

    content = content.replace('* @version v0.0.0', `* @version v${bundler.packageJson.version}`);

    content = content.replace('namespace WPBundler;', `namespace ${config.assetLoader.namespace};`);

    content = content.replace("private static $mode = 'prod'", `protected static $mode = '${mode}'`);
    content = content.replace("private static $host = 'localhost'", `protected static $host = '${host}'`);
    content = content.replace('private static $port = 3000', `protected static $port = ${port}`);
    content = content.replace("private static $dev_client = ''", `private static $dev_client = '${client}'`);

    content = content.replace(
      "private static $domain = 'domain';",
      `private static $domain = '${config.translations?.domain ?? ''}';`,
    );

    content = content.replace(
      "private static $outdir = '/build/';",
      `private static $outdir = '/${trimSlashes(config.outdir)}/';`,
    );

    content = content.replace(
      "private static $prefix = 'wp-bundler.';",
      `private static $prefix = '${slugify(project.packageJson.name ?? 'wp-bundler')}.';`,
    );

    content = content.replace('private static $assets = [];', `private static $assets = ${assetsArray};`);

    return content;
  };
}

function metafileToAssets({ outputs }: Pick<Metafile, 'outputs'>, entryPoints: BundlerConfig['entryPoints']) {
  let assets: AssetsRecord = {};
  let names = Object.keys(entryPoints);

  for (let name of names) {
    let keys = Object.keys(outputs);
    let js = keys.find((key) => key.includes(name) && key.endsWith('.js') && !key.endsWith('.nomodule.js'));

    let nomodule = keys.find((key) => key.includes(name) && /\.nomodule\.[a-zA-Z0-9]+\.js$/g.test(key));

    let css = keys.find((key) => key.includes(name) && key.endsWith('.css'));

    assets[name] = {
      js: js ? path.basename(js) : undefined,
      nomodule: nomodule ? path.basename(nomodule) : undefined,
      css: css ? path.basename(css) : undefined,
      deps: js != null ? findBuiltinDependencies(outputs[js]?.inputs ?? {}) : [],
    };
  }

  return assets;
}

export function toPhpArray(obj: Record<string, unknown> | Array<unknown>) {
  let arr = '[';

  function inner(value: unknown): string | null {
    if (typeof value === 'string') {
      return `"${value}"`;
    }

    if (typeof value === 'number') {
      return `${value}`;
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (value === null) {
      return 'null';
    }

    if (typeof value === 'undefined') {
      return null;
    }

    if (Array.isArray(value)) {
      return toPhpArray(value);
    }

    if (typeof value === 'object' && value != null) {
      return toPhpArray(value as Record<string, unknown>);
    }

    return null;
  }

  if (Array.isArray(obj)) {
    for (let value of obj) {
      let val = inner(value);
      arr += `${val ?? '$__undefined'},`;
    }
  } else {
    for (let key of Object.keys(obj)) {
      let val = inner(obj[key]);
      if (val != null) arr += `"${key}"=>${val},`;
    }
  }

  arr += ']';
  return arr;
}

function trimSlashes(str: string) {
  return str.replace(/^\./, '').replace(/^\//, '').replace(/\/$/, '');
}
