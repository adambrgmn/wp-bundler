#!/usr/bin/env node
import { main } from './dist/index.js';

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
