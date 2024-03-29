<?php
/**
 * This file is auto generated from the `wp-bundler` cli. The AutoLoader class
 * is supposed to be used to load assets generated by the wp-bundler cli.
 *
 * This file should be ignored by your version control system, e.g. git.
 *
 * @package WPBundler
 * @author  Adam Bergman <adam@fransvilhelm.com>
 * @license MIT https://opensource.org/licenses/MIT
 * @version v0.0.0
 * @link    https://github.com/adambrgmn/wp-bundler
 * @since   1.0.0
 */

namespace WPBundler;

/**
 * Core class to register and enqueue assets generated by the wp-bundler cli.
 *
 * @package WPBundler
 * @author  Adam Bergman <adam@fransvilhelm.com>
 * @license MIT https://opensource.org/licenses/MIT
 * @link    https://github.com/adambrgmn/wp-bundler
 * @since   1.0.0
 */
class AssetLoader
{
    /**
     * Indicates if the loader is prepared yet. To avoid doubles.
     *
     * @since 1.0.0
     * @var bool
     */
    private static $prepared = false;

    /**
     * Current mode of wp-bundler, dev or prod
     *
     * @since 2.0.0
     * @var bool
     */
    private static $mode = 'prod';

    /**
     * Current mode of wp-bundler, dev or prod
     *
     * @since 2.0.0
     * @var bool
     */
    private static $host = 'localhost';

    /**
     * Current mode of wp-bundler, dev or prod
     *
     * @since 2.0.0
     * @var bool
     */
    private static $port = 3000;

    /**
     * Domain used for translations.
     *
     * @since 1.0.0
     * @var string
     */
    private static $domain = 'domain';

    /**
     * Prefix used to set a more unique namespace for the assets.
     *
     * @since 3.0.0
     * @var string
     */
    private static $prefix = 'wp-bundler.';

    /**
     * Build directory, relative to template root directory.
     *
     * @since 1.0.0
     * @var string
     */
    private static $outdir = '/build/';

    /**
     * Assets generated by the cli.
     *
     * @since 1.0.0
     * @var array
     */
    private static $assets = [];

    /**
     * Root directory of the theme or plugin. This is automatically handled for themes, but needs to
     * be passed as an argument for plugins.
     *
     * @since 3.0.0
     * @var string
     */
    private static $rootdir = '';

    /**
     * Root uri of the theme or plugin. This is automatically handled for themes, but needs to be
     * passed as an argument for plugins.
     *
     * @since 3.0.0
     * @var string
     */
    private static $rooturi = '';

    /**
     * Prepare the asset loader by setting up required actions and filters. This
     * method should be called as early as possible.
     *
     * @since 1.0.0
     * @param string $rootdir Root directory of the theme or plugin. This is automatically handled for themes, but needs to be passed as an argument for plugins.
     * @param string $rooturi Root uri of the theme or plugin. This is automatically handled for themes, but needs to be passed as an argument for plugins.
     * @return void
     */
    public static function prepare(string $rootdir = '', string $rooturi = ''): void
    {
        if (self::$prepared) {
            return;
        }

        if ($rootdir === '') {
            $rootdir = \get_stylesheet_directory();
        }

        if ($rooturi === '') {
            $rooturi = \get_stylesheet_directory_uri();
        }

        self::$rootdir = $rootdir;
        self::$rooturi = $rooturi;

        if (self::$mode === 'dev') {
            \add_action('wp_enqueue_scripts', [get_called_class(), 'enqueueDevScript']);
            \add_action('admin_enqueue_scripts', [get_called_class(), 'enqueueDevScript']);
        }

        \add_filter('script_loader_tag', [get_called_class(), 'filterModuleScripts'], 10, 2);

        self::$prepared = true;
    }

    /**
     * Setup wp action and enqueue the scripts related to the provided handle.
     *
     * @since 1.0.0
     *
     * @param string $name     Name of asset to enqueue.
     * @param array  $deps     Optional. Dependecy array (e.g. jquery, wp-i18n etc.).
     * @param bool   $inFooter Optional. Wether to enqueue scripts in the footer (defaults to `true`).
     * @param string $action   Action to hook into (defaults to `'wp_enqueue_scripts'`).
     * @return void
     */
    public static function enqueueAssets(
        string $name,
        array $deps = [],
        bool $inFooter = true,
        string $action = 'wp_enqueue_scripts'
    ): void {
        self::prepare();
        \add_action($action, function () use ($name, $deps, $inFooter) {
            self::enqueue($name, $deps, $inFooter);
        });
    }

    /**
     * Enqueue assets with the `'enqueue_block_editor_assets'` wp action.
     *
     * @since 1.0.0
     *
     * @param string $name Name of asset to enqueue.
     * @param array  $deps Optional. Dependency array (e.g. jquery, wp-i18n etc.).
     * @return void
     */
    public static function enqueueEditorAssets(string $name, array $deps = []): void
    {
        self::prepare();
        self::enqueueAssets($name, $deps, true, 'enqueue_block_editor_assets');
    }

    /**
     * Enqueue assets with the `'enqueue_block_editor_assets'` wp action.
     *
     * @since 1.0.0
     *
     * @param string $name Name of asset to enqueue.
     * @param array  $deps Optional. Dependency array (e.g. jquery, wp-i18n etc.).
     * @return void
     */
    public static function enqueueAdminAssets(string $name, array $deps = []): void
    {
        self::prepare();
        self::enqueueAssets($name, $deps, true, 'admin_enqueue_scripts');
    }

    /**
     * Enqueue a block type with its related assets.
     *
     * @since 1.0.0
     *
     * @param string $name        Name of assets to register as part of the block
     * @param string $blockName   Name of the block to register
     * @param array  $blockConfig Optional. Array of block type arguments. Accepts any public property of `WP_Block_Type`. See WP_Block_Type::__construct() for information on accepted arguments. Default empty array.
     * @param array  $deps        Optional. Dependency array (e.g. jquery, wp-i18n etc.).
     * @return void
     */
    public static function enqueueBlockType(
        string $name,
        string $blockName,
        array $blockConfig = [],
        array $deps = []
    ): void {
        self::prepare();
        \add_action('init', function () use ($name, $blockName, $blockConfig, $deps) {
            self::registerBlockType($name, $blockName, $blockConfig, $deps);
        });
    }

    /**
     * Register assets.
     *
     * @since 1.0.0
     *
     * @param string $name     Name of asset to register.
     * @param array  $deps     Optional. Array with two keys, js and css containing each types dependencies. Note that js dependencies are often automatically detected.
     * @param bool   $inFooter Optional. Render script tag in footer (defaults to `true`).
     * @return array Returns array of registered handles by type (js, css, nomodule).
     */
    public static function register(string $name, array $deps = [], bool $inFooter = true): array
    {
        $handles = [];

        $jsDeps = [];
        $cssDeps = [];
        if (key_exists('js', $deps)) {
            $jsDeps = $deps['js'];
        }
        if (key_exists('css', $deps)) {
            $cssDeps = $deps['css'];
        }

        if (!key_exists($name, self::$assets)) {
            return $handles;
        }

        $asset = self::$assets[$name];

        if (key_exists('js', $asset)) {
            $handle = self::$prefix . $name;
            $handles['js'] = $handle;

            \wp_register_script(
                $handle,
                self::outDirUri($asset['js']),
                array_merge($asset['deps'], $jsDeps),
                false,
                $inFooter
            );

            \wp_set_script_translations($handle, self::$domain, self::outDirPath('languages'));
        }

        if (key_exists('nomodule', $asset)) {
            $handle = self::$prefix . $name . '.nomodule';
            $handles['nomodule'] = $handle;

            \wp_register_script(
                $handle,
                self::outDirUri($asset['nomodule']),
                array_merge($asset['deps'], $jsDeps),
                false,
                $inFooter
            );
        }

        if (key_exists('css', $asset)) {
            $handle = self::$prefix . $name;
            $handles['css'] = $handle;

            \wp_register_style($handle, self::outDirUri($asset['css']), $cssDeps, false, 'all');
        }

        return $handles;
    }

    /**
     * Enqueue assets.
     *
     * @since 1.0.0
     *
     * @param string $name     Name of asset to enqueue.
     * @param array  $deps     Optional. Dependency array (e.g. jquery, wp-i18n etc.).
     * @param bool   $inFooter Optional. Render script tag in footer (defaults to `true`).
     * @return array Returns array of registered handles by type (js, css, nomodule).
     */
    public static function enqueue(string $name, array $deps = [], bool $inFooter = true): array
    {
        $handles = self::register($name, $deps, $inFooter);

        foreach ($handles as $key => $handle) {
            if ($key === 'css') {
                \wp_enqueue_style($handle);
            } else {
                \wp_enqueue_script($handle);
            }
        }

        return $handles;
    }

    /**
     * Register assets as related to a specific block type.
     *
     * @param string $name        Name of assets to register as part of the block
     * @param string $blockName   Name of the block to register
     * @param array  $blockConfig Optional. Array of block type arguments. Accepts any public property of `WP_Block_Type`. See WP_Block_Type::__construct() for information on accepted arguments. Default empty array.
     * @param array  $deps        Optional. Dependency array (e.g. jquery, wp-i18n etc.).
     * @return \WP_Block_Type|false The registered block type on success, or false on failure.
     */
    public static function registerBlockType(string $name, string $blockName, array $blockConfig = [], array $deps = [])
    {
        $handles = self::register($name, $deps);

        if (key_exists('js', $handles)) {
            $blockConfig['editor_script'] = $handles['js'];
        }

        if (key_exists('css', $handles)) {
            $blockConfig['editor_style'] = $handles['css'];
        }

        return \register_block_type($blockName, $blockConfig);
    }

    /**
     * Get full uri path to theme directory.
     *
     * @param string $path Path to append to theme directory uri
     * @return string
     */
    private static function outDirUri(string $path): string
    {
        return self::$rooturi . self::$outdir . $path;
    }

    /**
     * Get full path to theme directory.
     *
     * @param string $path Path to append to theme directory
     * @return string
     */
    private static function outDirPath(string $path): string
    {
        return self::$rootdir . self::$outdir . $path;
    }

    /**
     * Enqueue the dev script which enables automatic reload on changes
     * during development.
     */
    public static function enqueueDevScript()
    {
        \wp_register_script('wp-bundler-dev-client', '', [], false, false);

        \wp_add_inline_script(
            'wp-bundler-dev-client',
            'window.WP_BUNDLER_HOST = "' . self::$host . '"; window.WP_BUNDLER_PORT = ' . self::$port . ';'
        );
        \wp_add_inline_script('wp-bundler-dev-client', self::$dev_client);

        \wp_enqueue_script('wp-bundler-dev-client');
    }

    /**
     * Filter the script tags enqueued by WordPress and properly set type
     * module on the scripts that should be. And nomodule on the scripts that
     * should have it.
     *
     * @param string $tag The full tag
     * @param string $handle The handle used to enqueue the tag
     * @return string
     */
    public static function filterModuleScripts(string $tag, string $handle): string
    {
        if (!str_contains($handle, self::$prefix)) {
            return $tag;
        }

        if (str_contains($handle, '.nomodule')) {
            return str_replace(' src', ' nomodule src', $tag);
        }

        $tag = str_replace('text/javascript', 'module', $tag);
        if (!str_contains('module', $tag)) {
            /**
             * When loaded as part of the block editor the script tag,
             * for some reason doesn't include `type="text/javascript"`.
             * In that case we need to do one more str_replace.
             */
            $tag = str_replace('<script', '<script type="module"', $tag);
        }

        return $tag;
    }

    /**
     * Script inlined during development.
     *
     * @since 2.0.0
     * @var string
     */
    private static $dev_client = '';
}
