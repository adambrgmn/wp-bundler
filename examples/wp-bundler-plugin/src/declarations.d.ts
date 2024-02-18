declare module '@wordpress/i18n' {
  export function __(text: string, domain?: string): string;
}

declare module '*.module.css' {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}
