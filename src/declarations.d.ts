declare module 'postcss-preset-env' {
  import { AcceptedPlugin } from 'postcss';
  function postcssPresetEnv(options?: Record<string, any>): AcceptedPlugin;
  export = postcssPresetEnv;
}
