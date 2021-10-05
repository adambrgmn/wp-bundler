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

export const PluralMessageWithoutContextSchema = MessageBaseSchema.extend({ single: z.string(), plural: z.string() });
export const PluralMessageWithContextSchema = PluralMessageWithoutContextSchema.extend({ context: z.string() });
export const PluralMessageSchema = z.union([PluralMessageWithoutContextSchema, PluralMessageWithContextSchema]);

export type PluralMessageWithoutContext = z.infer<typeof PluralMessageWithoutContextSchema>;
export type PluralMessageWithContext = z.infer<typeof PluralMessageWithContextSchema>;
export type PluralMessage = z.infer<typeof PluralMessageSchema>;

export const isPluralMessage = (v: unknown): v is PluralMessage => {
  let res = PluralMessageSchema.safeParse(v);
  return res.success;
};

export const SingleMessageWithoutContextSchema = MessageBaseSchema.extend({ text: z.string() });
export const SingleMessageWithContextSchema = SingleMessageWithoutContextSchema.extend({ context: z.string() });
export const SingleMessageSchema = z.union([SingleMessageWithoutContextSchema, SingleMessageWithContextSchema]);

export type SingleMessageWithoutContext = z.infer<typeof SingleMessageWithoutContextSchema>;
export type SingleMessageWithContext = z.infer<typeof SingleMessageWithContextSchema>;
export type SingleMessage = z.infer<typeof SingleMessageSchema>;

export const isSingleMessage = (v: unknown): v is SingleMessage => {
  let res = SingleMessageSchema.safeParse(v);
  return res.success;
};

export const TranslationMessageSchema = z.union([PluralMessageSchema, SingleMessageSchema]);
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
