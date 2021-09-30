import ts from 'typescript';

type MessageBase = { node: ts.Node };
type PluralMessage = MessageBase & {
  single: string;
  plural: string;
  domain?: string;
};
type PluralMessageWithContext = MessageBase & PluralMessage & { context: string };
type SingleMessage = MessageBase & { text: string; domain?: string };
type SingleMessageWithContext = MessageBase & SingleMessage & { context: string };
export type TranslationMessage = PluralMessage | PluralMessageWithContext | SingleMessage | SingleMessageWithContext;
