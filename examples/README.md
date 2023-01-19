# WP Bundler examples

This directory can be used to test the functionality of `wp-bundler`. To run the examples you can use `@wordpress/env` to spin up a quick WordPress environment.

```sh
# Move into this folder
$ cd ./examples
$ npm run --prefix ./wp-bundler-plugin build
$ npm run --prefix ./wp-bundler-theme build
$ npx -p @wordpress/env wp-env start
```

To stop and/or detroy the environment use `npx -p @wordpress/env wp-env stop` and `npx -p @wordpress/env wp-env destroy`.
