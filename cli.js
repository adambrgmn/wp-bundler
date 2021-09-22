#!/usr/bin/env node
import { main } from './dist/index.js';

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
