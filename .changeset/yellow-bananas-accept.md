---
'@fransvilhelm/wp-bundler': patch
---

Skip marking node globals as external

Doing this hides errors that should otherwise be surfaced. Because marking them as just "external" forces the browser to
try and import these libraries (`import fs from 'fs'`) in the browser. Which ofcourse blows up. Now we instead rely on
esbuild to report errors when our scripts (or their dependencies) tries to import any built-in node modules.
