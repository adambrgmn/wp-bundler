<?php

use WPBundler\Assets\AssetLoader;

require_once __DIR__ . '/wp.php';
require_once __DIR__ . '/dist/AssetLoader.php';

$title = 'Development';
$scripts = [];
$styles = [];

AssetLoader::prepare();
AssetLoader::register('app');

$tags = get_tags();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo $title; ?></title>

  <?php foreach ($tags['styles'] as $style) {
      echo sprintf('<link href="%s" rel="stylesheet">', $style['src']);
  } ?>

  <?php foreach ($tags['inline'] as $inline) {
      echo '<script type="application/javascript">';
      echo $inline;
      echo '</script>';
  } ?>
</head>
<body>
  <div id="root"></div>

  <script type="application/javascript">
    window.wp = {};
    window.wp.i18n = {
      __(str) { return str; },
      sprintf(str) { return str; },
    }
  </script>

  <script src="https://unpkg.com/react@17/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js" crossorigin></script>

  <?php foreach ($tags['scripts'] as $script) {
      echo sprintf(
          '<script src="%1$s" id="%2$s" %3$s></script>',
          $script['src'],
          $script['handle'],
          str_contains($script['handle'], 'nomodule') ? 'nomodule' : 'type="module"'
      );
  } ?>
</body>
</html>