import { Location } from 'esbuild';

type MessageBase = { location: Location; domain?: string; translators?: string };
type PluralMessage = MessageBase & { single: string; plural: string };
type PluralMessageWithContext = PluralMessage & { context: string };
type SingleMessage = MessageBase & { text: string };
type SingleMessageWithContext = SingleMessage & { context: string };
export type TranslationMessage = PluralMessage | PluralMessageWithContext | SingleMessage | SingleMessageWithContext;
