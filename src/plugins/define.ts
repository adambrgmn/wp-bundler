import * as fs from 'node:fs';
import * as process from 'node:process';
import * as util from 'node:util';

import type { BundlerPlugin } from '../types.js';

export const define: BundlerPlugin = ({ mode, project }) => ({
  name: 'wp-bundler-define',
  setup(build) {
    build.initialOptions.define = build.initialOptions.define ?? {};

    let NODE_ENV = mode === 'dev' ? 'development' : 'production';
    build.initialOptions.define['process.env.NODE_ENV'] = JSON.stringify(NODE_ENV);

    let envFiles = ['.env', `.env.${NODE_ENV}`, '.env.local', `.env.${NODE_ENV}.local`];
    const env: Record<string, string> = {};

    for (let file of envFiles) {
      const filePath = project.paths.absolute(file);
      if (fs.existsSync(filePath)) {
        const envContent = fs.readFileSync(filePath, 'utf-8');
        Object.assign(env, util.parseEnv(envContent));
      }
    }

    Object.assign(env, structuredClone(process.env));

    let WP_ = /^WP_/i;
    for (let key of Object.keys(env)) {
      if (WP_.test(key)) {
        build.initialOptions.define[`process.env.${key}`] = JSON.stringify(env[key]);
      }
    }
  },
});
