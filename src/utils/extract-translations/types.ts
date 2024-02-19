import * as z from 'zod';

// Based on `Location` from esbuild
const LocationSchema = z.object({
  file: z.string(),
  namespace: z.string(),
  line: z.number(),
  column: z.number(),
  length: z.number(),
  lineText: z.string(),
  suggestion: z.string(),
});

const MessageBaseSchema = z.object({
  location: LocationSchema,
  domain: z.string().optional(),
  translators: z.string().optional(),
});

const PluralMessageWithoutContextSchema = MessageBaseSchema.extend({ single: z.string(), plural: z.string() });
const PluralMessageWithContextSchema = PluralMessageWithoutContextSchema.extend({ context: z.string() });
const PluralMessageSchema = z.union([PluralMessageWithoutContextSchema, PluralMessageWithContextSchema]);

type PluralMessageWithContext = z.infer<typeof PluralMessageWithContextSchema>;
type PluralMessage = z.infer<typeof PluralMessageSchema>;

export const isPluralMessage = (v: unknown): v is PluralMessage => {
  let res = PluralMessageSchema.safeParse(v);
  return res.success;
};

const SingleMessageWithoutContextSchema = MessageBaseSchema.extend({ text: z.string() });
const SingleMessageWithContextSchema = SingleMessageWithoutContextSchema.extend({ context: z.string() });
const SingleMessageSchema = z.union([SingleMessageWithoutContextSchema, SingleMessageWithContextSchema]);

type SingleMessageWithContext = z.infer<typeof SingleMessageWithContextSchema>;

const TranslationMessageSchema = z.union([PluralMessageSchema, SingleMessageSchema]);
export type TranslationMessage = z.infer<typeof TranslationMessageSchema>;
export const isTranslationMessage = (v: unknown): v is TranslationMessage => {
  let res = TranslationMessageSchema.safeParse(v);
  return res.success;
};

export const isContextMessage = (value: unknown): value is PluralMessageWithContext | SingleMessageWithContext => {
  if (PluralMessageWithContextSchema.safeParse(value).success) return true;
  if (SingleMessageWithContextSchema.safeParse(value).success) return true;
  return false;
};
