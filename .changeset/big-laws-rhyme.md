---
'@fransvilhelm/wp-bundler': minor
---

Improve handling of react

Previously we relied on React being imported every time you wanted to use jsx (`import React from 'react';`). But with this change the jsx factory is injected when needed and you no longer have to import react.

It also improves how the jsx factory is handled. Previously it used `React.createElement`. But now it instead using `createElement` from `'@wordpress/element'`.
