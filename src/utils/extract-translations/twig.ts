import { Location } from 'esbuild';
import {
  createArrayLoader,
  createEnvironment,
  createSource,
  TwingArrayNode,
  TwingBaseNode,
  TwingCommentNode,
  TwingFunctionNode,
  TwingNode,
} from 'twing';

import { TranslationMessage } from './types.js';
import { isTranslatorsComment } from './utils.js';
import { ensure } from '../assert.js';

export { mightHaveTranslations } from './php.js';

export function extractTranslations(source: string, filename: string): TranslationMessage[] {
  let messages: TranslationMessage[] = [];

  let lastTranslators: string | undefined = undefined;

  visitAll(getAst(source, filename), (node) => {
    if (node.type === 'function') {
      let translation = extractTranslationFromCall(node, filename);
      if (translation) {
        translation.translators = lastTranslators;
        lastTranslators = undefined;
        messages.push(translation);
      }
    }

    if (node.type === 'comment') {
      let translators = getTranslatorComment(node);
      if (translators) lastTranslators = translators;
    }
  });

  return messages;
}

const env = createEnvironment(createArrayLoader({}), {});

function getAst(code: string, filename: string) {
  let source = createSource(filename, code);
  return env.parse(env.tokenize(source), { strict: false });
}

function visitAll(node: TwingNode, callback: (node: TwingNode) => void) {
  node.children;
  for (let child of getChildren(node)) {
    callback(child);
    visitAll(child, callback);
  }
}

function getChildren(node: TwingBaseNode): TwingNode[] {
  return Object.values(node.children);
}

function extractTranslationFromCall(call: TwingFunctionNode, file: string): TranslationMessage | null {
  let location: Location = {
    file,
    namespace: '',
    line: call.line,
    column: call.column - 1,
    length: 0,
    lineText: '',
    suggestion: '',
  };

  let args = call.children.arguments;

  switch (call.attributes.operatorName) {
    case '__':
    case '_e':
    case 'esc_attr__':
    case 'esc_attr_e':
    case 'esc_html__':
    case 'esc_html_e':
      return {
        text: ensure(getArgumentStringValue(args, 0)),
        domain: getArgumentStringValue(args, 1),
        location,
      };

    case '_x':
    case '_ex':
    case 'esc_attr_x':
    case 'esc_html_x':
      return {
        text: ensure(getArgumentStringValue(args, 0)),
        context: ensure(getArgumentStringValue(args, 1)),
        domain: getArgumentStringValue(args, 2),
        location,
      };

    case '_n':
      return {
        single: ensure(getArgumentStringValue(args, 0)),
        plural: ensure(getArgumentStringValue(args, 1)),
        domain: getArgumentStringValue(args, 3),
        location,
      };

    case '_n_noop':
      return {
        single: ensure(getArgumentStringValue(args, 0)),
        plural: ensure(getArgumentStringValue(args, 1)),
        domain: getArgumentStringValue(args, 2),
        location,
      };

    case '_nx':
      return {
        single: ensure(getArgumentStringValue(args, 0)),
        plural: ensure(getArgumentStringValue(args, 1)),
        context: ensure(getArgumentStringValue(args, 3)),
        domain: getArgumentStringValue(args, 4),
        location,
      };

    case '_nx_noop':
      return {
        single: ensure(getArgumentStringValue(args, 0)),
        plural: ensure(getArgumentStringValue(args, 1)),
        context: ensure(getArgumentStringValue(args, 2)),
        domain: getArgumentStringValue(args, 3),
        location,
      };

    default:
      return null;
  }
}

function getArgumentStringValue(args: TwingArrayNode, index: number) {
  /**
   * When parsing the ast twing inserts indices as part of the arguments for some unknown reason.
   * That's why we have to cater for the fact that the "array" looks like this:
   * `[{value:0}, {value: 'Translation'}, {value: 1}, {value: 'domain'}]`
   */
  let clean_index = index * 2 + 1;
  let argument = args.children[`${clean_index}`];
  if (argument == null) return undefined;

  let attr = 'value' in argument.attributes ? argument.attributes.value : undefined;
  return typeof attr === 'string' ? attr : undefined;
}

function getTranslatorComment(node: TwingCommentNode) {
  let comment = node.attributes.data;
  if (isTranslatorsComment(comment)) return comment;
  return null;
}
