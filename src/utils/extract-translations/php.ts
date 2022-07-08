import { Call, Comment, CommentBlock, Engine, Node, String } from 'php-parser';

import { TranslationMessage } from './types';
import { isTranslatorsComment, phpNodeToLocation, trimComment } from './utils';

export const WP_TRANSLATION_FUNCTIONS = [
  '__',
  '_e',
  'esc_attr__',
  'esc_attr_e',
  'esc_html__',
  'esc_html_e',
  '_x',
  '_ex',
  'esc_attr_x',
  'esc_html_x',
  '_n',
  '_n_noop',
  '_nx',
  '_nx_noop',
];

export function mightHaveTranslations(source: string): boolean {
  return WP_TRANSLATION_FUNCTIONS.some((fn) => source.includes(fn));
}

export function extractTranslations(source: string, filename: string): TranslationMessage[] {
  let parser = new Engine({ parser: { php7: true, extractDoc: true }, ast: { withPositions: true } });
  let program = parser.parseCode(source, filename);
  let translations: TranslationMessage[] = [];

  let lastTranslators: string | undefined = undefined;
  visitAll(program, (node) => {
    let translators = getTranslatorComment(node);
    if (translators) lastTranslators = translators;

    if (isCallNode(node)) {
      let translation = extractTranslationFromCall(node, filename);
      if (translation != null) {
        translation.translators = lastTranslators;
        lastTranslators = undefined;
        translations.push(translation);
      }
    }
  });

  return translations;
}

function visitAll(nodes: Node[] | Node, callback: (node: Node, parent?: Node) => boolean | undefined | null | void) {
  for (let node of Array.isArray(nodes) ? nodes : [nodes]) {
    let shouldContinue = callback(node);
    if (shouldContinue === false) return;

    for (let key of childrenKeys) {
      let children = (node as any)[key];
      if (children != null) {
        visitAll(children, callback);
      }
    }
  }
}

const childrenKeys = [
  'arguments',
  'alternate',
  'body',
  'catches',
  'children',
  'expr',
  'expression',
  'expressions',
  'trueExpr',
  'falseExpr',
  'items',
  'key',
  'left',
  'right',
  'value',
  'what',
] as const;

function isCallNode(node?: Node | null): node is Call {
  return node != null && node.kind === 'call';
}

function isStringNode(node?: Node | null): node is String {
  return node != null && node.kind === 'string';
}

function hasLeadingComments(
  node?: Node | null,
): node is Omit<Node, 'leadingComments'> & { leadingComments: Comment[] | CommentBlock[] } {
  return node != null && Array.isArray(node.leadingComments);
}

function getCalledFunction(call: Call): string | null {
  if (call.kind === 'call' && typeof call.what.name === 'string') {
    return call.what.name.replace(/^\\/g, '');
  }

  return null;
}

function extractTranslationFromCall(call: Call, filename: string): TranslationMessage | null {
  let name = getCalledFunction(call);
  const getStringVal = (val: Node) => (isStringNode(val) && typeof val.value === 'string' ? val.value : null);

  let location = phpNodeToLocation(call, filename);

  switch (name) {
    case '__':
    case '_e':
    case 'esc_attr__':
    case 'esc_attr_e':
    case 'esc_html__':
    case 'esc_html_e':
      return {
        text: getStringVal(call.arguments[0]) ?? '',
        domain: getStringVal(call.arguments[1]) ?? undefined,
        location,
      };

    case '_x':
    case '_ex':
    case 'esc_attr_x':
    case 'esc_html_x':
      return {
        text: getStringVal(call.arguments[0]) ?? '',
        context: getStringVal(call.arguments[1]) ?? '',
        domain: getStringVal(call.arguments[2]) ?? undefined,
        location,
      };

    case '_n':
      return {
        single: getStringVal(call.arguments[0]) ?? '',
        plural: getStringVal(call.arguments[1]) ?? '',
        domain: getStringVal(call.arguments[3]) ?? undefined,
        location,
      };

    case '_n_noop':
      return {
        single: getStringVal(call.arguments[0]) ?? '',
        plural: getStringVal(call.arguments[1]) ?? '',
        domain: getStringVal(call.arguments[2]) ?? undefined,
        location,
      };

    case '_nx':
      return {
        single: getStringVal(call.arguments[0]) ?? '',
        plural: getStringVal(call.arguments[1]) ?? '',
        context: getStringVal(call.arguments[3]) ?? '',
        domain: getStringVal(call.arguments[4]) ?? undefined,
        location,
      };

    case '_nx_noop':
      return {
        single: getStringVal(call.arguments[0]) ?? '',
        plural: getStringVal(call.arguments[1]) ?? '',
        context: getStringVal(call.arguments[2]) ?? '',
        domain: getStringVal(call.arguments[3]) ?? undefined,
        location,
      };

    default:
      return null;
  }
}

function getTranslatorComment(node?: Node): string | undefined {
  if (hasLeadingComments(node)) {
    let comments = node.leadingComments.map((comment) => trimComment(comment.value));

    for (let comment of comments) {
      if (isTranslatorsComment(comment)) return comment;
    }

    return undefined;
  }

  return undefined;
}
