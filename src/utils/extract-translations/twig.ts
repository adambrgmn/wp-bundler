import type { Location } from 'esbuild';
import type { TwingNode, TwingNodeModule } from 'twing';
import {
  TwingEnvironment,
  TwingLoaderNull,
  TwingNodeComment,
  TwingNodeExpressionConstant,
  TwingNodeExpressionFunction,
  TwingSource,
} from 'twing';

import type { TranslationMessage } from './types.js';
import { isTranslatorsComment } from './utils.js';

export { mightHaveTranslations } from './php.js';

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
        text: getArgumentStringValue(args, 0) ?? '',
        domain: getArgumentStringValue(args, 1) ?? undefined,
        location,
      };

    case '_x':
    case '_ex':
    case 'esc_attr_x':
    case 'esc_html_x':
      return {
        text: getArgumentStringValue(args, 0) ?? '',
        context: getArgumentStringValue(args, 1) ?? '',
        domain: getArgumentStringValue(args, 2) ?? undefined,
        location,
      };

    case '_n':
      return {
        single: getArgumentStringValue(args, 0) ?? '',
        plural: getArgumentStringValue(args, 1) ?? '',
        domain: getArgumentStringValue(args, 3) ?? undefined,
        location,
      };

    case '_n_noop':
      return {
        single: getArgumentStringValue(args, 0) ?? '',
        plural: getArgumentStringValue(args, 1) ?? '',
        domain: getArgumentStringValue(args, 2) ?? undefined,
        location,
      };

    case '_nx':
      return {
        single: getArgumentStringValue(args, 0) ?? '',
        plural: getArgumentStringValue(args, 1) ?? '',
        context: getArgumentStringValue(args, 3) ?? '',
        domain: getArgumentStringValue(args, 4) ?? undefined,
        location,
      };

    case '_nx_noop':
      return {
        single: getArgumentStringValue(args, 0) ?? '',
        plural: getArgumentStringValue(args, 1) ?? '',
        context: getArgumentStringValue(args, 2) ?? '',
        domain: getArgumentStringValue(args, 3) ?? undefined,
        location,
      };

    default:
      return null;
  }
}

function getArgumentStringValue(args: TwingNode, index: number): string | null {
  try {
    let argument = args.getNode(index);
    if (argument instanceof TwingNodeExpressionConstant) {
      let attr = argument.getAttribute('value');
      return typeof attr === 'string' ? attr : null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

function getTranslatorComment(node: TwingNodeComment) {
  let comment = node.getAttribute('data');
  if (typeof comment === 'string' && isTranslatorsComment(comment)) {
    return comment;
  }

  return null;
}
