import * as fs from 'fs/promises';
import PO from 'pofile';
import merge from 'lodash.merge';
import { parse } from 'po2json';
import md5 from 'md5';
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
    this.filename = filename;
    this.po = original;

    for (let key of Object.keys(original)) {
      // @ts-ignore
      this[key] = original[key];
    }
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
    let existing = this.items.find((item) => item.msgid === msgid && item);

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
  }

  toJED(domain: string, filterItems?: (item: typeof this['items'][number]) => boolean) {
    let po: ExtendedPO = this;
    if (filterItems != null) po = this.clone(filterItems);
    if (po.items.length < 1) return null;
    let result = parse(po.toString(), { format: 'jed', domain });

    /**
     * For some reason the po->json parser sets creates an null value at the
     * start of each translation. This is not spec compliant, or at least
     * doesn't work well with WordPress. Therefore we need to loop thru all
     * keys and remove that initial element in the array.
     */
    for (let key of Object.keys(result.locale_data[domain])) {
      if (key === '') continue;
      result.locale_data[domain][key] = result.locale_data[domain][key].slice(1);
    }

    return result;
  }
}

export function generateTranslationFilename(domain: string, language: string, file: string): string {
  let md5Path = md5(file);
  return `${domain}-${language}-${md5Path}.json`;
}
