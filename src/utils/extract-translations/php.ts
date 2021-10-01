import { Call, Comment, CommentBlock, Engine, Node, String } from 'php-parser';
import { TranslationMessage } from './types';
import { phpNodeToLocation } from './utils';

export function extractTranslations(source: string, filename: string): TranslationMessage[] {
  let parser = new Engine({ parser: { php7: true, extractDoc: true }, ast: { withPositions: true } });
  let program = parser.parseCode(source, filename);
  let translations: TranslationMessage[] = [];

  visitAll(program, (node, parent) => {
    if (isCallNode(node)) {
      let translation = extractTranslationFromCall(node, filename, parent);
      if (translation != null) translations.push(translation);
      return false;
    }
  });

  return translations;
}

function visitAll(
  nodes: Node[] | Node,
  callback: (node: Node, parent?: Node) => boolean | undefined | null | void,
  parent?: Node,
) {
  for (let node of Array.isArray(nodes) ? nodes : [nodes]) {
    let shouldContinue = callback(node, parent);
    if (shouldContinue === false) return;

    for (let key of childrenKeys) {
      let children = (node as any)[key];
      if (children != null) {
        visitAll(children, callback, node);
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

function extractTranslationFromCall(call: Call, filename: string, parent: Node | undefined): TranslationMessage | null {
  let name = getCalledFunction(call);
  const getStringVal = (val: Node) => (isStringNode(val) && typeof val.value === 'string' ? val.value : null);

  let translators = getTranslatorComment(parent);

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
        location: phpNodeToLocation(call, filename),
        translators,
      };

    case '_x':
    case '_ex':
    case 'esc_attr_x':
    case 'esc_html_x':
      return {
        text: getStringVal(call.arguments[0]) ?? '',
        context: getStringVal(call.arguments[1]) ?? '',
        domain: getStringVal(call.arguments[2]) ?? undefined,
        location: phpNodeToLocation(call, filename),
        translators,
      };

    case '_n':
    case '_n_noop':
      return {
        single: getStringVal(call.arguments[0]) ?? '',
        plural: getStringVal(call.arguments[1]) ?? '',
        domain: getStringVal(call.arguments[3]) ?? undefined,
        location: phpNodeToLocation(call, filename),
        translators,
      };

    case '_nx':
    case '_nx_noop':
      return {
        single: getStringVal(call.arguments[0]) ?? '',
        plural: getStringVal(call.arguments[1]) ?? '',
        context: getStringVal(call.arguments[3]) ?? '',
        domain: getStringVal(call.arguments[4]) ?? undefined,
        location: phpNodeToLocation(call, filename),
        translators,
      };

    default:
      return null;
  }
}
function getTranslatorComment(node?: Node): string | undefined {
  if (hasLeadingComments(node)) {
    let comments = node.leadingComments.map((comment) => {
      let lines = comment.value.split('\n').map((line) => {
        return (
          line
            .trim()
            // //
            .replace(/^\/\//, '')
            // /*
            .replace(/^\/\*+/, '')
            // *
            .replace(/\*+\/$/, '')
            // */
            .replace(/^\*+/, '')
            .trim()
        );
      });

      return lines.filter(Boolean).join('\n');
    });

    for (let comment of comments) {
      if (comment.toLowerCase().startsWith('translators:')) {
        return comment;
      }
    }

    return undefined;
  }

  return undefined;
}
