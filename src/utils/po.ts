import * as fs from 'fs/promises';
import { po, mo, GetTextTranslations, GetTextTranslation } from 'gettext-parser';
import mergeWith from 'lodash.mergewith';
import { TranslationMessage } from './extract-translations';

export class Po {
  private parsedTranslations: GetTextTranslations;
  public filename: string;

  constructor(source: string | Buffer, filename: string) {
    this.parsedTranslations = po.parse(source, 'utf-8');
    this.filename = filename;
    this.parsedTranslations.headers['Plural-Forms'] = 'nplurals=2; plural=(n != 1);';
  }

  static async load(filename: string): Promise<Po> {
    try {
      let source = await fs.readFile(filename);
      return new Po(source, filename);
    } catch (error) {
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

  async write(filename = this.filename) {
    await fs.writeFile(filename, this.toString());
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

  set(message: TranslationMessage | GetTextTranslation) {
    let next = isTranslationMessage(message) ? messageToTranslationItem(message) : message;

    let translations = this.parsedTranslations.translations[next.msgctxt ?? ''];
    if (translations == null) {
      this.parsedTranslations.translations[next.msgctxt ?? ''] = {};
      translations = this.parsedTranslations.translations[next.msgctxt ?? ''];
    }

    translations[next.msgid] = mergeWith(
      translations[next.msgid] ?? {},
      next,
      (objValue: unknown, srcValue: unknown, key: string) => {
        if (
          ['extracted', 'reference', 'translator', 'flag', 'previous'].includes(key) &&
          typeof objValue === 'string' &&
          typeof srcValue === 'string'
        ) {
          let lines = [...objValue.trim().split('\n'), ...srcValue.trim().split('\n')];
          return lines
            .filter((line, i, self) => !!line && self.indexOf(line) === i)
            .join('\n')
            .replace(/translators:/gi, 'translators:');
        }
      },
    );
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
    // Remove all unused translations
    for (let translation of this.translations) {
      if (!pot.has(translation.msgid, translation.msgctxt)) {
        this.remove(translation.msgid, translation.msgctxt);
      }
    }

    // Set or update existing ones
    for (let translation of pot.translations) {
      this.set(translation);
    }
  }

  toString() {
    let buffer = po.compile(this.parsedTranslations);
    return buffer.toString('utf-8');
  }

  toMo(filterTranslation?: (t: GetTextTranslation) => boolean): Buffer {
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

    return mo.compile(data);
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

    let lang = this.parsedTranslations.headers['Language'] ?? '';
    let pluralForms = this.parsedTranslations.headers['Plural-Forms'] ?? '';

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

  get translations() {
    let translations: GetTextTranslation[] = [];

    for (let ctx of Object.values(this.parsedTranslations.translations)) {
      translations.push(...Object.values(ctx));
    }

    return translations;
  }

  get language(): string | null {
    let language = this.parsedTranslations.headers['Language'];
    if (language == null || language === '') return null;
    return language;
  }

  get headers() {
    return this.parsedTranslations.headers;
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

function isTranslationMessage(value: any): value is TranslationMessage {
  return value != null && ('text' in value || 'single' in value);
}

function messageToTranslationItem(message: TranslationMessage): GetTextTranslation {
  return {
    msgctxt: 'context' in message ? message.context : undefined,
    msgid: 'single' in message ? message.single : message.text,
    msgid_plural: 'plural' in message ? message.plural : undefined,
    msgstr: [],
    comments: {
      translator: '',
      reference: `${message.location.file}:${message.location.line}`,
      extracted: message.translators ?? '',
      flag: '',
      previous: '',
    },
  };
}
