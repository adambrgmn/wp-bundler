---
'@fransvilhelm/wp-bundler': minor
---

Add support for plugins

This builder wasn't supported by plugins before since the generated `AssetLoader` included some functions tied to specific themes. But with this relase the bundler also supports plugins.

The only thing you need to do is pass root directory and url to the `AssetLoader::prepare` call in you main entry file:

```php
require_once __DIR__ . '/dist/AssetLoader.php';

WPBundler\AssetLoader::prepare(\plugin_dir_path(__FILE__), \plugin_dir_url(__FILE__));
WPBundler\AssetLoader::enqueueAssets('main');
```
