declare module 'postcss-preset-env' {
  import { AcceptedPlugin } from 'postcss';
  function postcssPresetEnv(options?: Record<string, any>): AcceptedPlugin;
  export = postcssPresetEnv;
}

declare module 'tailwindcss' {
  import { AcceptedPlugin } from 'postcss';
  function postcssTailwindcss(any): AcceptedPlugin;
  export = postcssTailwindcss;
}
