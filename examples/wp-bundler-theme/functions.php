<?php

namespace WPBundlerTheme;

use WPBundlerTheme\AssetLoader;

require_once __DIR__ . '/dist/AssetLoader.php';

AssetLoader::prepare();

AssetLoader::enqueueAssets('main');
AssetLoader::enqueueAdminAssets('admin');

add_action('init', function () {
    \load_theme_textdomain('wp-bundler-theme', \get_stylesheet_directory() . '/languages');
});
