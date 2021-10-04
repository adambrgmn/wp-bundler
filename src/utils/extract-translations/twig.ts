import { TwingEnvironment, TwingLoaderNull, TwingSource, TwingTokenStream } from 'twing';
import { Token, TokenType } from 'twig-lexer';
import { Location } from 'esbuild';
import { TranslationMessage } from './types';
import { WP_TRANSLATION_FUNCTIONS } from './php';

export { mightHaveTranslations } from './php';

export function extractTranslations(source: string, filename: string): TranslationMessage[] {
  let messages: TranslationMessage[] = [];
  let stream = getTokenStream(source, filename);
  let calls = findTranslationCalls(stream);
  for (let call of calls) {
    let message = extractTranslationFromCall2(call, filename);
    if (message != null) messages.push(message);
  }

  return messages;
}

const env = new TwingEnvironment(new TwingLoaderNull());
function getTokenStream(code: string, filename: string) {
  let source = new TwingSource(code, filename);
  let stream = env.tokenize(source);
  return stream;
}

function findTranslationCalls(stream: TwingTokenStream) {
  let calls: { name: string; args: string[]; token: Token }[] = [];
  let previous: Token | undefined;

  while (!stream.isEOF()) {
    let current = stream.next();
    if (
      current.type === TokenType.PUNCTUATION &&
      current.value === '(' &&
      previous != null &&
      previous.type === TokenType.NAME &&
      WP_TRANSLATION_FUNCTIONS.includes(previous.value)
    ) {
      let args = getArgs(stream);
      calls.push({ name: previous.value, args, token: previous });
    }

    previous = current;
  }

  return calls;
}

function getArgs(stream: TwingTokenStream) {
  let args: string[] = [];
  let current = stream.next();
  while (!stream.isEOF() && current.value !== ')') {
    if (current.type === TokenType.STRING) {
      args.push(current.value);
    } else if (current.type === TokenType.PUNCTUATION && current.value === '(') {
      getArgs(stream);
    }
    current = stream.next();
  }

  return args;
}

function extractTranslationFromCall2(
  call: { name: string; args: string[]; token: Token },
  file: string,
): TranslationMessage | null {
  let location: Location = {
    file,
    namespace: '',
    line: call.token.line,
    column: call.token.column - 1,
    length: 0,
    lineText: '',
    suggestion: '',
  };

  switch (call.name) {
    case '__':
    case '_e':
    case 'esc_attr__':
    case 'esc_attr_e':
    case 'esc_html__':
    case 'esc_html_e':
      return {
        text: call.args[0] ?? '',
        domain: call.args[1] ?? undefined,
        location,
      };

    case '_x':
    case '_ex':
    case 'esc_attr_x':
    case 'esc_html_x':
      return {
        text: call.args[0] ?? '',
        context: call.args[1] ?? '',
        domain: call.args[2] ?? undefined,
        location,
      };

    case '_n':
    case '_n_noop':
      return {
        single: call.args[0] ?? '',
        plural: call.args[1] ?? '',
        domain: call.args[2] ?? undefined,
        location,
      };

    case '_nx':
    case '_nx_noop':
      return {
        single: call.args[0] ?? '',
        plural: call.args[1] ?? '',
        context: call.args[2] ?? '',
        domain: call.args[3] ?? undefined,
        location,
      };

    default:
      return null;
  }
}
