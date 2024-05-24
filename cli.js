#!/usr/bin/env node
import process from 'node:process';

import { cli } from './dist/index.js';

cli().catch(() => process.exit(1));
