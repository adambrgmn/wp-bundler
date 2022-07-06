---
'@fransvilhelm/wp-bundler': minor
---

Introduce build & dev sub commands

Previously `wp-bundler` worked as a single command, without nothing but flags as the arguments.

But to cater for future improvements I've choosen to split the command into sub commands – for now `wp-bundler build` for production and `wp-bundler dev` for development.

The old behaviour is still around, but is marked as deprecated and is not recommended for new projects. It will be removed in the next major release.
