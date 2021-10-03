import { Location } from 'esbuild';
import { TranslationMessage } from './types';

export { mightHaveTranslations } from './php';

export function extractTranslations(source: string, filename: string): TranslationMessage[] {
  let messages: TranslationMessage[] = [];
  let matches = gettextRegex
    .flatMap((re) => Array.from(source.matchAll(re)))
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  for (let match of matches) {
    let message = extractTranslationFromCall(match, source, filename);
    if (message != null) messages.push(message);
  }

  return messages;
}

const gettextRegex = [
  // _e( "text", "domain" )
  // __( "text", "domain" )
  // translate( "text", "domain" )
  // esc_attr__( "text", "domain" )
  // esc_attr_e( "text", "domain" )
  // esc_html__( "text", "domain" )
  // esc_html_e( "text", "domain" )
  /(?<name>__|_e|translate|esc_attr__|esc_attr_e|esc_html__|esc_html_e)\((?<args>\s*?['"].+?['"]\s*?,\s*?['"].+?['"]\s*?)\)/g,

  // _n( "single", "plural", number, "domain" )
  /(?<name>_n)\((?<args>\s*?['"].*?['"]\s*?,\s*?['"].*?['"]\s*?,\s*?.+?\s*?,\s*?['"].+?['"]\s*?)\)/g,

  // _x( "text", "context", "domain" )
  // _ex( "text", "context", "domain" )
  // esc_attr_x( "text", "context", "domain" )
  // esc_html_x( "text", "context", "domain" )
  // _nx( "single", "plural", "number", "context", "domain" )
  /(?<name>_x|_ex|_nx|esc_attr_x|esc_html_x)\((?<args>\s*?['"].+?['"]\s*?,\s*?['"].+?['"]\s*?,\s*?['"].+?['"]\s*?)\)/g,

  // _n_noop( "singular", "plural", "domain" )
  // _nx_noop( "singular", "plural", "context", "domain" )
  /(?<name>_n_noop|_nx_noop)\((?<args>(\s*?['"].+?['"]\s*?),(\s*?['"]\w+?['"]\s*?,){0,1}\s*?['"].+?['"]\s*?)\)/g,
];

function extractTranslationFromCall(match: RegExpMatchArray, source: string, file: string): TranslationMessage | null {
  let name = match.groups?.name;
  let args = match.groups?.args;

  if (name == null || args == null) return null;

  let parsedArgs = parseArgs(args);
  let location = matchToLocation(match, source, file);

  switch (name) {
    case '__':
    case '_e':
    case 'esc_attr__':
    case 'esc_attr_e':
    case 'esc_html__':
    case 'esc_html_e':
      return {
        text: parsedArgs[0] ?? '',
        domain: parsedArgs[1] ?? undefined,
        location,
      };

    case '_x':
    case '_ex':
    case 'esc_attr_x':
    case 'esc_html_x':
      return {
        text: parsedArgs[0] ?? '',
        context: parsedArgs[1] ?? '',
        domain: parsedArgs[2] ?? undefined,
        location,
      };

    case '_n':
    case '_n_noop':
      return {
        single: parsedArgs[0] ?? '',
        plural: parsedArgs[1] ?? '',
        domain: parsedArgs[3] ?? undefined,
        location,
      };

    case '_nx':
    case '_nx_noop':
      return {
        single: parsedArgs[0] ?? '',
        plural: parsedArgs[1] ?? '',
        context: parsedArgs[3] ?? '',
        domain: parsedArgs[4] ?? undefined,
        location,
      };

    default:
      return null;
  }
}

function parseArgs(args: string): (string | undefined)[] {
  return args.split(',').map<string | undefined>((arg) => {
    try {
      let val = JSON.parse(arg.replace(/'|"|`/g, '"'));
      if (typeof val === 'string') return val;
      return undefined;
    } catch (error) {
      return undefined;
    }
  });
}

function matchToLocation(match: RegExpMatchArray, source: string, file: string): Location {
  let pos = match.index ?? 0;
  let substring = source.substr(0, pos);
  let lines = substring.split('\n');
  let line = lines.length;
  let column = lines[line - 1].length;

  return {
    file,
    namespace: '',
    line,
    column,
    length: 0,
    lineText: '',
    suggestion: '',
  };
}

// export function tsNodeToLocation(node: TsNode, fnName: string, source: string, file: string): Location {
//   let pos = source.indexOf(fnName, node.pos);
//   let substring = source.substr(0, pos);
//   let lines = substring.split('\n');
//   let line = lines.length;
//   let column = lines[line - 1].length;

//   return {
//     file,
//     namespace: '',
//     line,
//     column,
//     length: 0,
//     lineText: '',
//     suggestion: '',
//   };
// }
