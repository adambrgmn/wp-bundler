---
'@fransvilhelm/wp-bundler': major
---

Add proper dev server with reload on change

This version includes a new dev server. The server is automatically started when running `wp-bundler --watch`.

The server will listen for changes to your source files, including `.php` and `.twig` files. If a change is detected the
page will be reloaded and the changes applied.

If a change only affects `.css`-files the page will not be reloaded. Instead all your css will be "hot-reladed" on the
page without requiring a refresh.
