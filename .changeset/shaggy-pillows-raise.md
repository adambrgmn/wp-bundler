---
'@fransvilhelm/wp-bundler': minor
---

Move to virtual file system for bundler

The main benefit of this is testing. Instead of the bundler always emitting files we can now assert on the virtual output in tests.
