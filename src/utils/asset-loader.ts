import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';
import { Metafile } from 'esbuild';
import { BundlerConfig } from '../schema';
import { BundlerPluginOptions, ProjectInfo } from '../types';
import { findBuiltinDependencies } from './externals';

interface Asset {
  js?: string;
  nomodule?: string;
  css?: string;
  deps: string[];
}

type AssetsRecord = Record<string, Asset>;

interface TemplateCompileOptions {
  metafile: Pick<Metafile, 'outputs'>;
  config: BundlerConfig;
  bundler: ProjectInfo;
}

export function createAssetLoaderTemplate({
  config,
  bundler,
  project,
}: BundlerPluginOptions) {
  let templatePath = bundler.paths.absolute('./assets/AssetLoader.php');
  let templateOutPath = project.paths.absolute(config.assetLoader.path);
  let compile = createTemplate(readFileSync(templatePath, 'utf-8'));

  return async ({ metafile }: Pick<TemplateCompileOptions, 'metafile'>) => {
    await fs.writeFile(templateOutPath, compile({ metafile, config, bundler }));
  };
}

function createTemplate(content: string) {
  return function compile({
    metafile,
    config,
    bundler,
  }: TemplateCompileOptions) {
    let assetsArray = toPhpArray(
      metafileToAssets(metafile, config.entryPoints),
    );

    content = content.replace(
      '* @version v0.0.0',
      `* @version v${bundler.packageJson.version}`,
    );

    content = content.replace(
      'namespace WPBundler;',
      `namespace ${config.assetLoader.namespace};`,
    );

    content = content.replace(
      "private static $domain = 'domain';",
      `private static $domain = '${config.translations?.domain ?? ''}';`,
    );

    content = content.replace(
      "private static $outdir = '/build/';",
      `private static $outdir = '/${trimSlashes(config.outdir)}/';`,
    );

    content = content.replace(
      'private static $assets = [];',
      `private static $assets = ${assetsArray};`,
    );

    return content;
  };
}

function metafileToAssets(
  { outputs }: Pick<Metafile, 'outputs'>,
  entryPoints: BundlerConfig['entryPoints'],
) {
  let assets: AssetsRecord = {};
  let names = Object.keys(entryPoints);

  for (let name of names) {
    let keys = Object.keys(outputs);
    let js = keys.find(
      (key) =>
        key.includes(name) &&
        key.endsWith('.js') &&
        !key.endsWith('.nomodule.js'),
    );

    let nomodule = keys.find(
      (key) => key.includes(name) && key.endsWith('.nomodule.js'),
    );

    let css = keys.find((key) => key.includes(name) && key.endsWith('.css'));

    assets[name] = {
      js: js ? path.basename(js) : undefined,
      nomodule: nomodule ? path.basename(nomodule) : undefined,
      css: css ? path.basename(css) : undefined,
      deps: js != null ? findBuiltinDependencies(outputs[js].inputs) : [],
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
