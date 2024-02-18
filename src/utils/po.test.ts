import { Location } from 'esbuild';
import { expect, it } from 'vitest';

import { Po } from './po.js';

it('appends a new translation if a similar one does not exist', async () => {
  let po = await Po.load('test.po');

  po.set({ text: 'A', domain: 'wp', location: createLocation() });
  expect(po.translations).toHaveLength(1);
  po.set({ text: 'B', domain: 'wp', location: createLocation() });
  expect(po.translations).toHaveLength(2);
});

it('updates already existing translations', async () => {
  let po = await Po.load('test.po');

  po.set({ text: 'A', domain: 'wp', location: createLocation({ file: 'test1.ts' }) });
  expect(po.translations).toHaveLength(1);
  po.set({ text: 'A', domain: 'wp', location: createLocation({ file: 'test2.ts' }) });
  expect(po.translations).toHaveLength(1);

  expect(po.get('A')?.comments?.reference).toMatchInlineSnapshot(`
    "test1.ts:1
    test2.ts:1"
  `);
});

it('can update a po file with data from a pot', async () => {
  let po = await Po.load('test.po');
  let pot = await Po.load('test.pot');

  po.set({
    msgid: 'A',
    msgstr: ['A'],
    comments: {
      reference: 'old.ts:1',
      extracted: 'translators: old stuff',
      translator: 'A comment to keep',
      flag: '',
      previous: '',
    },
  });

  pot.set({ text: 'A', domain: 'wp', location: createLocation('test.ts'), translators: 'translators: New translator' });

  po.updateFromTemplate(pot);
  expect(po.toString()).toMatchInlineSnapshot(`
    "msgid \\"\\"
    msgstr \\"\\"
    \\"Plural-Forms: nplurals=2; plural=(n != 1);\\\\n\\"
    \\"Content-Type: text/plain; charset=utf-8\\\\n\\"
    \\"Content-Transfer-Encoding: 8bit\\\\n\\"
    \\"MIME-Version: 1.0\\\\n\\"

    # A comment to keep
    #: test.ts:1
    #. translators: New translator
    msgid \\"A\\"
    msgstr \\"A\\"
    "
  `);
});

it('keeps unreferenced translations in the bottom', async () => {
  let po = await Po.load('test.po');
  let pot = await Po.load('test.pot');

  po.set({ msgid: 'A unused 1', msgstr: ['Unused'] });
  po.set({ msgid: 'A unused 2', msgstr: ['Unused'] });
  po.set({ msgid: 'A', msgstr: ['A'] });

  pot.set({ text: 'A', domain: 'wp', location: createLocation({ file: 'test1.ts' }) });
  pot.set({ text: 'B', domain: 'wp', location: createLocation({ file: 'test2.ts' }) });

  po.updateFromTemplate(pot);
  expect(po.toString()).toMatchInlineSnapshot(`
    "msgid \\"\\"
    msgstr \\"\\"
    \\"Plural-Forms: nplurals=2; plural=(n != 1);\\\\n\\"
    \\"Content-Type: text/plain; charset=utf-8\\\\n\\"
    \\"Content-Transfer-Encoding: 8bit\\\\n\\"
    \\"MIME-Version: 1.0\\\\n\\"

    #: test1.ts:1
    msgid \\"A\\"
    msgstr \\"A\\"

    #: test2.ts:1
    msgid \\"B\\"
    msgstr \\"\\"

    # THIS TRANSLATION IS NO LONGER REFERENCED INSIDE YOUR PROJECT
    msgid \\"A unused 1\\"
    msgstr \\"Unused\\"

    # THIS TRANSLATION IS NO LONGER REFERENCED INSIDE YOUR PROJECT
    msgid \\"A unused 2\\"
    msgstr \\"Unused\\"
    "
  `);
});

it('outputs proper JED with `.toJed`', async () => {
  let po = await Po.load('test.po');

  po.set({ msgid: 'Hello', msgstr: ['Hej'] });
  po.set({ msgid: 'World', msgstr: ['Världen'] });
  po.set({ msgid: 'Hello', msgstr: ['Hejsan'], msgctxt: 'relaxed' });

  expect(po.toJed('wp')).toMatchInlineSnapshot(`
    {
      "domain": "wp",
      "locale_data": {
        "wp": {
          "": {
            "domain": "wp",
            "lang": "",
            "plural-forms": "nplurals=2; plural=(n != 1);",
          },
          "Hello": [
            "Hej",
          ],
          "World": [
            "Världen",
          ],
          "relaxedHello": [
            "Hejsan",
          ],
        },
      },
    }
  `);
});

it('outputs proper JED with `.toJed` with filtered translations', async () => {
  let po = await Po.load('test.po');

  po.set({ msgid: 'Hello', msgstr: ['Hej'] });
  po.set({ msgid: 'World', msgstr: ['Världen'] });
  po.set({ msgid: 'Hello', msgstr: ['Hejsan'], msgctxt: 'relaxed' });

  expect(po.toJed('wp', ({ msgctxt }) => msgctxt === 'relaxed')).toMatchInlineSnapshot(`
    {
      "domain": "wp",
      "locale_data": {
        "wp": {
          "": {
            "domain": "wp",
            "lang": "",
            "plural-forms": "nplurals=2; plural=(n != 1);",
          },
          "relaxedHello": [
            "Hejsan",
          ],
        },
      },
    }
  `);
});

it('will output translations sorted by their msgid then their msgctxt', async () => {
  let po1 = await Po.load('test.po');
  po1.set({ text: 'A', context: 'context', domain: 'wp', location: createLocation() });
  po1.set({ text: 'A', domain: 'wp', location: createLocation() });
  po1.set({ text: 'B', domain: 'wp', location: createLocation() });

  let po2 = await Po.load('test.po');
  po2.set({ text: 'B', domain: 'wp', location: createLocation() });
  po2.set({ text: 'A', domain: 'wp', location: createLocation() });
  po2.set({ text: 'A', context: 'context', domain: 'wp', location: createLocation() });

  expect(po1.toString()).toEqual(po2.toString());
  expect(po1.toString()).toMatchInlineSnapshot(`
    "msgid \\"\\"
    msgstr \\"\\"
    \\"Plural-Forms: nplurals=2; plural=(n != 1);\\\\n\\"
    \\"Content-Type: text/plain; charset=utf-8\\\\n\\"
    \\"Content-Transfer-Encoding: 8bit\\\\n\\"
    \\"MIME-Version: 1.0\\\\n\\"

    #: test.ts:1
    msgid \\"A\\"
    msgstr \\"\\"

    #: test.ts:1
    msgctxt \\"context\\"
    msgid \\"A\\"
    msgstr \\"\\"

    #: test.ts:1
    msgid \\"B\\"
    msgstr \\"\\"
    "
  `);
});

it('should not overwrite headers in po file when updating from pot', async () => {
  let po = new Po(
    `
  msgid ""
  msgstr ""
  "Plural-Forms: nplurals=2; plural=(n != 1);\n"
  "Content-Type: text/plain; charset=UTF-8\n"
  "Content-Transfer-Encoding: 8bit\n"
  "MIME-Version: 1.0\n"
  "Language: en_US\n"
  `,
    'test.po',
  );
  let pot = await Po.load('test.pot');

  pot.set({ text: 'a', domain: 'wp', location: createLocation() });

  po.updateFromTemplate(pot);

  expect(po.toString()).toMatchInlineSnapshot(`
    "msgid \\"\\"
    msgstr \\"\\"
    \\"Plural-Forms: nplurals=2; plural=(n != 1);\\\\n\\"
    \\"Content-Type: text/plain; charset=utf-8\\\\n\\"
    \\"Content-Transfer-Encoding: 8bit\\\\n\\"
    \\"MIME-Version: 1.0\\\\n\\"
    \\"Language: en_US\\\\n\\"

    #: test.ts:1
    msgid \\"a\\"
    msgstr \\"\\"
    "
  `);
});

it('creates correct plural templates translations', async () => {
  let po = await Po.load('test.po');

  po.set({ single: 'test', plural: 'tester', domain: 'wp', location: createLocation() });
  expect(po.toString()).toMatchInlineSnapshot(`
    "msgid \\"\\"
    msgstr \\"\\"
    \\"Plural-Forms: nplurals=2; plural=(n != 1);\\\\n\\"
    \\"Content-Type: text/plain; charset=utf-8\\\\n\\"
    \\"Content-Transfer-Encoding: 8bit\\\\n\\"
    \\"MIME-Version: 1.0\\\\n\\"

    #: test.ts:1
    msgid \\"test\\"
    msgid_plural \\"tester\\"
    msgstr[0] \\"\\"
    msgstr[1] \\"\\"
    "
  `);
});

it('handles translations that exists as single but get appended as plural', () => {
  let po = new Po(
    `
  msgid ""
  msgstr ""
  "Plural-Forms: nplurals=2; plural=(n != 1);\n"
  "Content-Type: text/plain; charset=UTF-8\n"
  "Content-Transfer-Encoding: 8bit\n"
  "MIME-Version: 1.0\n"
  "Language: en_US\n"

  msgid "test"
  msgstr "test"
  `,
    'test.po',
  );

  po.set({ single: 'test', plural: 'tester', location: createLocation() });
  expect(po.toString()).toMatchInlineSnapshot(`
    "msgid \\"\\"
    msgstr \\"\\"
    \\"Plural-Forms: nplurals=2; plural=(n != 1);\\\\n\\"
    \\"Content-Type: text/plain; charset=utf-8\\\\n\\"
    \\"Content-Transfer-Encoding: 8bit\\\\n\\"
    \\"MIME-Version: 1.0\\\\n\\"
    \\"Language: en_US\\\\n\\"

    #: test.ts:1
    msgid \\"test\\"
    msgid_plural \\"tester\\"
    msgstr[0] \\"test\\"
    msgstr[1] \\"\\"
    "
  `);
});

it('removes removed comment if translation is brought back', async () => {
  let po = new Po(
    `
  msgid ""
  msgstr ""
  "Plural-Forms: nplurals=2; plural=(n != 1);\n"
  "Content-Type: text/plain; charset=UTF-8\n"
  "Content-Transfer-Encoding: 8bit\n"
  "MIME-Version: 1.0\n"
  "Language: en_US\n"

  # THIS TRANSLATION IS NO LONGER REFERENCED INSIDE YOUR PROJECT
  msgid "test"
  msgstr "test"
  `,
    'test.po',
  );

  let pot = await Po.load('test.pot');

  pot.set({ text: 'test', location: createLocation() });
  po.updateFromTemplate(pot);

  expect(po.toString()).toMatchInlineSnapshot(`
    "msgid \\"\\"
    msgstr \\"\\"
    \\"Plural-Forms: nplurals=2; plural=(n != 1);\\\\n\\"
    \\"Content-Type: text/plain; charset=utf-8\\\\n\\"
    \\"Content-Transfer-Encoding: 8bit\\\\n\\"
    \\"MIME-Version: 1.0\\\\n\\"
    \\"Language: en_US\\\\n\\"

    #: test.ts:1
    msgid \\"test\\"
    msgstr \\"test\\"
    "
  `);
});

function createLocation(replace: Partial<Location> = {}): Location {
  return {
    file: 'test.ts',
    namespace: '',
    line: 1,
    column: 0,
    length: 1,
    lineText: '',
    suggestion: '',
    ...replace,
  };
}
