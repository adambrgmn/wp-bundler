import { dirname } from './dirname';

it('outputs the __dirname and __filename variables based on import.url', () => {
  let { __dirname, __filename } = dirname(import.meta.url);
  expect(__dirname.endsWith('/wp-bundler/src/utils')).toBeTruthy();
  expect(__filename.endsWith('/wp-bundler/src/utils/dirname.test.ts')).toBeTruthy();
});
