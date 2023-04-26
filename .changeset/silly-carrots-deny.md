---
'@fransvilhelm/wp-bundler': patch
---

Remove postinstall script

The postinstall script was a stupid idea from the beginning, causing issues for `yarn` projects.

We're better off without it.
