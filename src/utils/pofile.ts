import * as fs from 'fs/promises';
import PO from 'pofile';
import merge from 'lodash.merge';
import { TranslationMessage } from './extract-translations';
import { nodeToLocation } from './ts-ast';

export class ExtendedPO extends PO {
  public filename: string;

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

    for (let key of Object.keys(original)) {
      // @ts-ignore
      this[key] = original[key];
    }
  }

  async write() {
    await fs.writeFile(this.filename, this.toString());
  }

  append(
    translation: TranslationMessage,
    reference: { path: string; source: string },
  ) {
    let msgid = 'single' in translation ? translation.single : translation.text;
    let existing = this.items.find((item) => item.msgid === msgid && item);

    if (existing == null) {
      existing = new PO.Item();
      this.items.push(existing);
    }

    let location = nodeToLocation(
      translation.node,
      reference.source,
      reference.path,
    );

    let next = {
      msgid,
      msgid_plural: 'plural' in translation ? translation.plural : undefined,
      msgctxt: 'context' in translation ? translation.context : undefined,
      references: [`${reference.path}:${location.line}`],
    };

    merge(existing, next);
  }
}
