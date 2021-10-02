// import { add } from './utils/math';
// @ts-ignore
import { __, _x, _n } from '@wordpress/i18n';
// @ts-ignore
import * as i18n from '@wordpress/i18n';
// @ts-ignore
import i18n2 from '@wordpress/i18n';
import { add } from './utils/math';

console.log(add(1, 2, 3));

_x('wtf 1', 'any', 'wp-bundler');
_n('wtf 2', "wtf's 2", 2, 'wp-bundler');
__('wtf 3', 'wp-bundler');
// translators: No wtf's given
__('wtf 3', 'wp-bundler');
i18n.__('wtf 4', 'wp-bundler');
i18n2.__('wtf 5', 'wp-bundler');
// @ts-ignore
wp.i18n.__('wtf 6', 'wp-bundler');
// @ts-ignore
window.wp.i18n.__('wtf 7', 'wp-bundler');
