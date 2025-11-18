import * as fs from 'node:fs/promises';

import type { OutputFile } from 'esbuild';
import { type GetTextTranslation, type GetTextTranslations, mo, po } from 'gettext-parser';
import mergeWith from 'lodash.mergewith';
import { stringToUint8Array } from 'uint8array-extras';
import * as z from 'zod';

import { ensure } from './assert.js';
import {
  type TranslationMessage,
  isContextMessage,
  isPluralMessage,
  isTranslationMessage,
} from './extract-translations/index.js';

const GetTextTranslationSchema = z.object({
  msgctxt: z.string().optional(),
  msgid: z.string().min(1),
  msgid_plural: z.string().min(1).optional(),
  msgstr: z.array(z.string()).default([]),
  comments: z
    .object({
      translator: z.string().optional().default(''),
      reference: z.string().optional().default(''),
      extracted: z.string().optional().default(''),
      flag: z.string().optional().default(''),
      previous: z.string().optional().default(''),
    })
    .optional()
    .default({ translator: '', reference: '', extracted: '', flag: '', previous: '' }),
});

function parse(source: string | Uint8Array) {
  let result = po.parse(Buffer.from(source));
  for (let key of Object.keys(result.translations)) {
    let context = ensure(result.translations[key]);
    result.translations[key] = Object.entries(context).reduce<GetTextTranslations['translations'][string]>(
      (acc, [key, translation]) => {
        if (key === '') {
          acc[key] = translation;
        } else {
          let parsed = GetTextTranslationSchema.safeParse(translation);
          if (parsed.success) acc[key] = parsed.data;
        }

        return acc;
      },
      {},
    );
  }

  return result;
}

export class Po {
  private parsedTranslations: GetTextTranslations;
  public filename: string;

  constructor(source: string | Uint8Array, filename: string) {
    this.parsedTranslations = parse(source);
    this.filename = filename;
    this.parsedTranslations.headers['Plural-Forms'] = 'nplurals=2; plural=(n != 1);';
  }

  static UNUSED_COMMENT = 'THIS TRANSLATION IS NO LONGER REFERENCED INSIDE YOUR PROJECT';

  static isUnused(translation: GetTextTranslation) {
    return translation.comments?.translator === Po.UNUSED_COMMENT;
  }

  static async load(filename: string): Promise<Po> {
    try {
      let source = await fs.readFile(filename);
      return new Po(source as Uint8Array, filename);
    } catch {
      return new Po(
        `
      msgid ""
      msgstr ""
      "Plural-Forms: nplurals=2; plural=(n != 1);\n"
      "Content-Type: text/plain; charset=UTF-8\n"
      "Content-Transfer-Encoding: 8bit\n"
      "MIME-Version: 1.0\n"
      `,
        filename,
      );
    }
  }

  async write(filename = this.filename, foldLength?: number) {
    await fs.writeFile(filename, this.toString(foldLength));
  }

  toOutputFile(filename = this.filename, foldLength?: number) {
    let text = this.toString(foldLength);
    return {
      path: filename,
      contents: stringToUint8Array(text),
      text: text,
      hash: '',
    } satisfies OutputFile;
  }

  has(id: string, context: string = '') {
    return this.get(id, context) != null;
  }

  hasContext(context: string) {
    return this.parsedTranslations.translations[context] != null;
  }

  get(id: string, context: string = ''): GetTextTranslation | undefined {
    let ctx = this.getContext(context);
    return ctx?.[id] ?? undefined;
  }

  getContext(context: string): GetTextTranslations['translations'][string] | undefined {
    return this.parsedTranslations.translations[context] ?? undefined;
  }

  set(message: TranslationMessage | GetTextTranslation, mergeComments: boolean = true) {
    let next = isTranslationMessage(message)
      ? messageToTranslationItem(message)
      : GetTextTranslationSchema.parse(message);

    let context = this.createContext(next.msgctxt ?? '');
    let current = this.get(next.msgid, next.msgctxt) ?? next;

    let final = mergeWith(
      current,
      next,
      (value: unknown, srcValue: unknown, key: string, obj: GetTextTranslation, source: GetTextTranslation) => {
        let keysToMerge = mergeComments ? ['reference', 'extracted', 'translator', 'flag', 'previous'] : ['translator'];

        if (keysToMerge.includes(key) && typeof value === 'string' && typeof srcValue === 'string') {
          let lines = [...value.trim().split('\n'), ...srcValue.trim().split('\n')];

          let out = lines
            // Keep only lines with content, and uniq
            .filter((line, i, self) => !!line && self.indexOf(line) === i)
            // Remove unused comment if translation is back in the game
            .filter((line) => {
              if (srcValue.includes(Po.UNUSED_COMMENT)) return true;
              return !line.includes(Po.UNUSED_COMMENT);
            })
            .sort()
            .join('\n')
            .replace(/translators:/gi, 'translators:');

          return out;
        }

        if (key === 'msgstr' && isStringArray(value) && isStringArray(srcValue)) {
          return minLengthMsgstr(
            value.map((prev, i) => srcValue[i] || prev || ''),
            obj.msgid_plural != null || source.msgid_plural != null,
          );
        }

        return undefined;
      },
    );

    context[next.msgid] = final;
  }

  createContext(context: string) {
    let existing = this.getContext(context);
    if (existing != null) return existing;

    this.parsedTranslations.translations[context] = {};
    return ensure(this.parsedTranslations.translations[context]);
  }

  remove(id: string, context: string = '') {
    let ctx = this.parsedTranslations.translations[context];
    if (ctx != null) {
      delete ctx[id];
    }
  }

  clear() {
    for (let ctx of Object.values(this.parsedTranslations.translations)) {
      for (let key of Object.keys(ctx)) {
        if (key !== '') {
          delete ctx[key];
        }
      }
    }
  }

  updateFromTemplate(pot: Po) {
    let removed: GetTextTranslation[] = [];

    // Remove all unused translations
    for (let translation of this.translations) {
      if (!pot.has(translation.msgid, translation.msgctxt)) {
        removed.push(translation);
        this.remove(translation.msgid, translation.msgctxt);
      }
    }

    // Set or update existing ones
    for (let translation of pot.translations) {
      this.set(translation, false);
    }

    // Append removed translations at the end
    for (let translation of removed) {
      translation.comments = {
        translator: Po.UNUSED_COMMENT,
        reference: '',
        extracted: '',
        flag: '',
        previous: '',
      };

      this.set(translation);
    }
  }

  toString(foldLength: number = 120 - 9) {
    let buffer = po.compile(this.parsedTranslations, { sort: compareTranslations, foldLength });
    return buffer.toString('utf-8');
  }

  toMo(filterTranslation?: (t: GetTextTranslation) => boolean) {
    let translations: GetTextTranslations['translations'] = {};
    for (let [contextKey, context] of Object.entries(this.parsedTranslations.translations)) {
      let nextContext: Record<string, GetTextTranslation> = {};
      translations[contextKey] = nextContext;

      for (let [msgid, translation] of Object.entries(context)) {
        if (filterTranslation == null || filterTranslation(translation)) {
          nextContext[msgid] = translation;
        }
      }
    }

    let data: GetTextTranslations = {
      ...this.parsedTranslations,
      translations,
    };

    return mo.compile(data) as Uint8Array;
  }

  toJed<Domain extends string>(
    domain: Domain,
    filterTranslation?: (t: GetTextTranslation) => boolean,
  ): JedFormat<Domain> | null {
    let DELIMITER = '\u0004';
    let translations: Record<string, string[]> = {};

    for (let translation of this.translations) {
      if (translation.msgid === '') continue;
      if (filterTranslation != null && !filterTranslation(translation)) continue;

      let key = [translation.msgctxt, translation.msgid].filter(Boolean).join(DELIMITER);
      translations[key] = translation.msgstr;
    }

    if (Object.keys(translations).length < 1) return null;

    let lang = this.header('Language') ?? '';
    let pluralForms = this.header('Plural-Forms') ?? '';

    return {
      domain,
      locale_data: {
        [domain]: {
          '': { domain, lang, 'plural-forms': pluralForms },
          ...translations,
        },
      } as LocaleData<Domain>,
    };
  }

  header(header: string): string | null {
    return this.headers[header] ?? null;
  }

  get headers() {
    return this.parsedTranslations.headers;
  }

  get translations() {
    return Object.values(this.parsedTranslations.translations)
      .flatMap((ctx) => Object.values(ctx))
      .filter(({ msgid }) => msgid !== '')
      .sort(compareTranslations);
  }
}

interface LocaleDataDefault<Domain extends string> {
  domain: Domain;
  lang: string;
  'plural-forms': string;
}

type LocaleData<Domain extends string> = {
  [key in Domain]: Record<string, string[]> & { '': LocaleDataDefault<Domain> };
};

interface JedFormat<Domain extends string = 'messages'> {
  domain: Domain;
  locale_data: LocaleData<Domain>;
}

function messageToTranslationItem(message: TranslationMessage) {
  return GetTextTranslationSchema.parse({
    msgctxt: isContextMessage(message) ? message.context : undefined,
    msgid: isPluralMessage(message) ? message.single : message.text,
    msgid_plural: isPluralMessage(message) ? message.plural : undefined,
    msgstr: isPluralMessage(message) ? ['', ''] : [''],
    comments: {
      reference: `${message.location.file}:${message.location.line}`,
      extracted: message.translators ?? '',
    },
  });
}

function compareTranslations(a: GetTextTranslation, b: GetTextTranslation) {
  if (Po.isUnused(a) && !Po.isUnused(b)) return 1;
  if (!Po.isUnused(a) && Po.isUnused(b)) return -1;

  let sort = a.msgid.localeCompare(b.msgid);
  if (sort === 0) sort = (a.msgctxt ?? '').localeCompare(b.msgctxt ?? '');

  return sort;
}

function minLengthMsgstr(msgstr: string[], plural: boolean) {
  return Array.from({ length: plural ? 2 : 1 }, (_, i) => msgstr[i] ?? '');
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}
