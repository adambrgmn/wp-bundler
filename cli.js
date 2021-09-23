#!/usr/bin/env node
import { build } from './dist/index.js';

const mode = process.argv.includes('--prod') ? 'prod' : 'dev';
build({ mode, cwd: process.cwd() })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
