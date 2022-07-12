<?php
/**
 * Plugin Name: WP Bundler Example plugin
 */

namespace WPBundlerPlugin;

use WPBundlerPlugin\AssetLoader;

require_once __DIR__ . '/dist/AssetLoader.php';

AssetLoader::prepare(\plugin_dir_path(__FILE__), \plugin_dir_url(__FILE__));

AssetLoader::enqueueAssets('main');
AssetLoader::enqueueAdminAssets('admin');
