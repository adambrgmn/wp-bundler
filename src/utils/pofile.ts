import * as fs from 'fs/promises';
import PO from 'pofile';
import merge from 'lodash.merge';
import md5 from 'md5';
import { uniq } from './uniq';
import { TranslationMessage } from './extract-translations';
import { nodeToLocation } from './ts-ast';

export class ExtendedPO extends PO {
  public filename: string;
  private po: PO;

  static async create(filename: string) {
    let po: PO;

    try {
      let source = await fs.readFile(filename, 'utf-8');
      po = PO.parse(source);
    } catch (error) {
      po = new PO();
    }

    return new ExtendedPO(filename, po);
  }

  constructor(filename: string, original: PO) {
    super();
    for (let key of Object.keys(original)) {
      // @ts-ignore
      this[key] = original[key];
    }

    this.filename = filename;
    this.po = original;
  }

  clone(filterItems: (item: typeof this['items'][number]) => boolean) {
    let next = new ExtendedPO(this.filename, this.po);
    next.items = this.items.filter(filterItems);
    return next;
  }

  async write() {
    await fs.writeFile(this.filename, this.toString());
  }

  append(translation: TranslationMessage, reference: { path: string; source: string }) {
    let msgid = 'single' in translation ? translation.single : translation.text;
    let existing = this.items.find((item) => item.msgid === msgid);

    if (existing == null) {
      existing = new PO.Item();
      this.items.push(existing);
    }

    let location = nodeToLocation(translation.node, reference.source, reference.path);

    let next = {
      msgid,
      msgid_plural: 'plural' in translation ? translation.plural : undefined,
      msgctxt: 'context' in translation ? translation.context : undefined,
      references: [`${reference.path}:${location.line}`],
    };

    merge(existing, next);
    existing.references = uniq(existing.references);
  }

  toJED(domain: string, filterItems?: (item: typeof this['items'][number]) => boolean) {
    let po: ExtendedPO = this;
    if (filterItems != null) po = this.clone(filterItems);
    if (po.items.length < 1) return null;

    return toJED(po, domain);
  }
}

export function generateTranslationFilename(domain: string, language: string, file: string): string {
  let md5Path = md5(file);
  return `${domain}-${language}-${md5Path}.json`;
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

function toJED<Domain extends string>(po: PO, domain: Domain): JedFormat<Domain> {
  let translations: Record<string, string[]> = {};
  for (let item of po.items) {
    translations[item.msgid] = item.msgstr;
  }

  let lang = po.headers.Language ?? '';
  let pluralForms = po.headers['Plural-Forms'] ?? '';

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
