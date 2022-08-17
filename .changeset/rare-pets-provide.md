---
'@fransvilhelm/wp-bundler': patch
---

Bundle @wordpress/icons instead of adding it as dependency

@wordpress/icons is treated as an internal packages and is not exposed on `window.wp` as the others. Instead this package should be bundled with the projects source. See #54 for context.
