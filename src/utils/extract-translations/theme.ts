import type { Location } from 'esbuild';

import type { TranslationMessage } from './index.js';

let find = [
  { comment: 'translators: Theme Name of the theme', re: /theme name:\s*(?<value>.+)/i },
  { comment: 'translators: Description of the theme', re: /description:\s*(?<value>.+)/i },
  { comment: 'translators: Theme URI of the theme', re: /theme uri:\s*(?<value>.+)/i },
  { comment: 'translators: Author of the theme', re: /author:\s*(?<value>.+)/i },
  { comment: 'translators: Author URI of the theme', re: /author uri:\s*(?<value>.+)/i },
];

export function extractTranslations(source: string, filename: string, domain: string): TranslationMessage[] {
  let translations: TranslationMessage[] = [];

  for (let { comment, re } of find) {
    let match = source.match(re);
    if (match == null || match.groups?.value == null) continue;
    translations.push({
      text: match.groups.value,
      domain,
      translators: comment,
      location: posToLocation(match.index ?? 0, source, filename),
    });
  }

  return translations;
}

function posToLocation(pos: number, source: string, file: string): Location {
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
