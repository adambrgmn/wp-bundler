import {
  TwingEnvironment,
  TwingLoaderNull,
  TwingNodeModule,
  TwingNode,
  TwingSource,
  TwingNodeExpressionFunction,
  TwingNodeExpressionConstant,
  TwingNodeComment,
} from 'twing';
import { Location } from 'esbuild';
import { TranslationMessage } from './types';
import { isTranslatorsComment } from './utils';

export { mightHaveTranslations } from './php';

export function extractTranslations(source: string, filename: string): TranslationMessage[] {
  let messages: TranslationMessage[] = [];

  let lastTranslators: string | undefined = undefined;

  visitAll(getAst(source, filename), (node) => {
    if (node instanceof TwingNodeExpressionFunction) {
      let translation = extractTranslationFromCall(node);
      if (translation) {
        translation.translators = lastTranslators;
        lastTranslators = undefined;
        messages.push(translation);
      }
    }

    if (node instanceof TwingNodeComment) {
      let translators = getTranslatorComment(node);
      if (translators) lastTranslators = translators;
    }
  });

  return messages;
}

const env = new TwingEnvironment(new TwingLoaderNull());

function getAst(code: string, filename: string): TwingNodeModule {
  let source = new TwingSource(code, filename);
  return env.parse(env.tokenize(source), { strict: false });
}

function visitAll(node: TwingNode, callback: (node: TwingNode) => void) {
  for (let [, child] of node.getNodes()) {
    callback(child);
    visitAll(child, callback);
  }
}

function extractTranslationFromCall(call: TwingNodeExpressionFunction): TranslationMessage | null {
  let location: Location = {
    file: call.getTemplateName(),
    namespace: '',
    line: call.getTemplateLine(),
    column: call.getTemplateColumn() - 1,
    length: 0,
    lineText: '',
    suggestion: '',
  };

  let args = call.getNode('arguments');

  switch (call.getAttribute('name')) {
    case '__':
    case '_e':
    case 'esc_attr__':
    case 'esc_attr_e':
    case 'esc_html__':
    case 'esc_html_e':
      return {
        text: getArgumentStringValue(args.getNode(0)) ?? '',
        domain: getArgumentStringValue(args.getNode(1)) ?? undefined,
        location,
      };

    case '_x':
    case '_ex':
    case 'esc_attr_x':
    case 'esc_html_x':
      return {
        text: getArgumentStringValue(args.getNode(0)) ?? '',
        context: getArgumentStringValue(args.getNode(1)) ?? '',
        domain: getArgumentStringValue(args.getNode(2)) ?? undefined,
        location,
      };

    case '_n':
    case '_n_noop':
      return {
        single: getArgumentStringValue(args.getNode(0)) ?? '',
        plural: getArgumentStringValue(args.getNode(1)) ?? '',
        domain: getArgumentStringValue(args.getNode(3)) ?? undefined,
        location,
      };

    case '_nx':
    case '_nx_noop':
      return {
        single: getArgumentStringValue(args.getNode(0)) ?? '',
        plural: getArgumentStringValue(args.getNode(1)) ?? '',
        context: getArgumentStringValue(args.getNode(3)) ?? '',
        domain: getArgumentStringValue(args.getNode(4)) ?? undefined,
        location,
      };

    default:
      return null;
  }
}

function getArgumentStringValue(argument: TwingNode): string | null {
  if (argument instanceof TwingNodeExpressionConstant) {
    let attr = argument.getAttribute('value');
    return typeof attr === 'string' ? attr : null;
  }

  return null;
}

function getTranslatorComment(node: TwingNodeComment) {
  let comment = node.getAttribute('data');
  if (typeof comment === 'string' && isTranslatorsComment(comment)) {
    return comment;
  }

  return null;
}
