---
'@fransvilhelm/wp-bundler': major
---

Rework cli output

Previoulsy the cli output was rendered with `ink` and `react`. That was effective and made it easy to make an interactive cli. But I've realized that this is not an interactive cli. I want `wp-bundler` to stay out of your way.

This rework means that the cli is no longer rendered with ink. Instead the output is regular `console.log`'s. This also has the benefit of working in non interactive cli environments as well.
