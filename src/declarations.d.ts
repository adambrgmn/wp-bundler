declare module 'po2json' {
  export interface ParseOptions<Domain extends string = 'messages'> {
    // Whether to include fuzzy translation in JSON or not. Should be either true or false. Defaults to false.
    fuzzy?: boolean;
    // If true, returns a JSON string. Otherwise returns a plain Javascript object. Defaults to false.
    stringify?: boolean;
    //  If true, the resulting JSON string will be pretty-printed. Has no effect when stringify is false. Defaults to false
    pretty?: boolean;
    // Defaults to raw.
    format?: 'raw' | 'jed' | 'jedold' | 'mf';
    // The domain the messages will be wrapped inside. Only has effect if format: 'jed'.
    domain?: Domain;
    // If true, f
    'fallback-to-msgid'?: boolean;
  }

  export interface LocaleDataDefault<Domain extends string> {
    domain: Domain;
    lang: string;
    'plural-forms': string;
  }

  export interface ParseResult<Domain extends string = 'messages'> {
    domain: Domain;
    locale_data: Record<
      Domain,
      {
        '': LocaleDataDefault<Domain>;
        [key: string]: string[];
      }
    >;
  }

  export function parse<Domain extends string = 'messages'>(
    buffer: Buffer | string,
    options?: ParseOptions<Domain>,
  ): ParseResult<Domain>;
}
