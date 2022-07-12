import * as fs from 'node:fs';
import * as process from 'node:process';

import * as dotenv from 'dotenv';

import { BundlerPlugin } from '../types';

export const define: BundlerPlugin = ({ mode, project }) => ({
  name: 'wp-bundler-define',
  setup(build) {
    build.initialOptions.define = build.initialOptions.define ?? {};

    let NODE_ENV = mode === 'dev' ? 'development' : 'production';
    build.initialOptions.define['process.env.NODE_ENV'] = JSON.stringify(NODE_ENV);
    build.initialOptions.define['__DEV__'] = JSON.stringify(mode === 'dev');
    build.initialOptions.define['__PROD__'] = JSON.stringify(mode === 'prod');

    let envFiles = [`.env.${NODE_ENV}.local`, '.env.local', `.env.${NODE_ENV}`, '.env'];

    for (let file of envFiles) {
      if (fs.existsSync(file)) dotenv.config({ path: project.paths.absolute(file) });
    }

    let WP_ = /^WP_/i;
    for (let key of Object.keys(process.env)) {
      if (WP_.test(key)) {
        build.initialOptions.define[`process.env.${key}`] = JSON.stringify(process.env[key]);
      }
    }
  },
});
