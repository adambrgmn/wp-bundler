<?php

function test()
{
    // translators: Hello world
    __('wtf 4', 'wp-bundler');
}

// translators: Hello world
$var = _x('My string', 'context', 'wp-bundler');
$var = __('My string', 'wp-bundler');
