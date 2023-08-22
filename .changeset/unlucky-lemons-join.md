---
'@fransvilhelm/wp-bundler': minor
---

Add support for css modules

Esbuild has had support for css modules for a while. But it has not been possible to use them with wp-bundler due to an implementation detail of the wp-bundler setup.

But from now on css modules are supported. Read more about how they [work in the esbuild context](https://esbuild.github.io/content-types/#local-css).
