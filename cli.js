#!/usr/bin/env node
import { main } from './dist/index.js';

const mode = process.argv.includes('--prod') ? 'prod' : 'dev';
main({ mode, cwd: process.cwd() })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
