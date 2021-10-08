<?php

$scripts = [];
$styles = [];
$inline = [];

function get_tags()
{
    global $scripts, $styles, $inline;
    return ['scripts' => $scripts, 'styles' => $styles, 'inline' => $inline];
}

function wp_register_script(string $handle, string $src, array $deps = [])
{
    global $scripts;

    $scripts[] = [
        'handle' => $handle,
        'src' => $src,
    ];

    return null;
}

function wp_register_style(string $handle, string $src, array $deps = [])
{
    global $styles;

    $styles[] = [
        'handle' => $handle,
        'src' => $src,
    ];

    return null;
}

function wp_add_inline_script(string $_, string $content)
{
    global $inline;
    $inline[] = $content;
}

function wp_enqueue_script()
{
    return null;
}

function get_template_directory_uri()
{
    return '';
}

function get_template_directory()
{
    return '';
}

function wp_set_script_translations()
{
    return null;
}

function add_filter()
{
    return null;
}

function add_action($_, $callback)
{
    call_user_func($callback);
}
