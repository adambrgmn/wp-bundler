<?php

$scripts = [];
$styles = [];

function get_tags()
{
    global $scripts, $styles;
    return ['scripts' => $scripts, 'styles' => $styles];
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
