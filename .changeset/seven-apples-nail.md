---
'@fransvilhelm/wp-bundler': major
---

Remove ability to call wp-bundler without sub commands

Previously we allowed calling `wp-bundler` without `dev` or `build` sub commands, like it was from v1. This release removes that ability. From now on you must call `wp-bundler dev` or `wp-bundler build`.
