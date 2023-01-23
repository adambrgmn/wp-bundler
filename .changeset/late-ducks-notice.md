---
'@fransvilhelm/wp-bundler': minor
---

Move away from multibundler setup

Previously we initiated two separate esbuild process to build the modern and legacy outputs. This meant we had no way to output a good asset loader witouth waiting for both of the outputs to be done and merge them.

With this approach the legacy output is moving into the main process again. Something that will speed up and make out lives much easier in the future.
