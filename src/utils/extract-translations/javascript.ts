import ts from 'typescript';
import { TranslationMessage } from './types';
import { isTranslatorsComment, trimComment, tsNodeToLocation } from './utils';

export function mightHaveTranslations(source: string): boolean {
  return source.includes('wp.i18n') || source.includes('@wordpress/i18n');
}

export function extractTranslations(source: string, filename: string): TranslationMessage[] {
  let sourceFile = ts.createSourceFile('admin.ts', source, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);

  let relevantImports = findRelevantImports(sourceFile);
  let messages = findTranslatableMessages(sourceFile, relevantImports, { source, filename });

  return messages;
}

const translatableMethods = ['_n', '_nx', '_x', '__'] as const;
type TranslatableMethod = typeof translatableMethods[number];
const isTranslatableMethod = (name: any): name is TranslatableMethod => {
  return translatableMethods.includes(name);
};

/**
 * Extract imported identifiers from a ts file. It will find default imports,
 * namespaced imports and named imports from '@wordpress/i18n'.
 *
 * @param sourceFile Source file to check for imports
 * @returns Array of imported identifiers
 */
function findRelevantImports(sourceFile: ts.SourceFile): ts.Identifier[] {
  let identifiers: ts.Identifier[] = [];

  visitAll(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      if (node.moduleSpecifier.getText(sourceFile).includes('@wordpress/i18n')) {
        let clause = node.importClause?.name ?? node.importClause?.namedBindings;
        if (clause != null) {
          switch (clause.kind) {
            // Default import
            case ts.SyntaxKind.Identifier:
              identifiers.push(clause);
              break;

            // Namespace import (* as i18n)
            case ts.SyntaxKind.NamespaceImport:
              identifiers.push(clause.name);
              break;

            // Named import ({ __, _x })
            case ts.SyntaxKind.NamedImports:
              let relevant = getRelevantNamedImports(clause);
              identifiers.push(...relevant);
              break;
          }
        }
      }

      return false;
    }
  });

  return identifiers;
}

/**
 * Extract all translatable data from within a file. Based on the imported
 * variables. It will also find calls to `[window.]wp.i18n`.
 *
 * @param sourceFile Source file to traverse and search witin
 * @param imports Relevant imported variables to look for
 * @returns An array of translation messages
 */
function findTranslatableMessages(
  sourceFile: ts.SourceFile,
  imports: ts.Identifier[],
  locationMeta: { source: string; filename: string },
) {
  let messages: TranslationMessage[] = [];

  let referencesImport = (expression: { getText(): string }) => {
    return imports.findIndex((imported) => imported.getText() === expression.getText()) > -1;
  };

  let lastTranslators: string | undefined = undefined;

  visitAll(sourceFile, (node) => {
    let message: TranslationMessage | null = null;
    let translators = getTranslatorComment(node, locationMeta.source);
    if (translators) lastTranslators = translators;

    if (!ts.isCallExpression(node)) return;

    // __(...)
    if (ts.isIdentifier(node.expression) && referencesImport(node.expression)) {
      message = extractMessage(node.expression, node.arguments, imports, locationMeta);
    }

    // i18n.__(...)
    if (ts.isPropertyAccessExpression(node.expression) && referencesImport(node.expression.expression)) {
      message = extractMessage(node.expression.name, node.arguments, null, locationMeta);
    }

    // wp.i18n.__(...) || window.wp.i18n.__(...)
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      (node.expression.expression.getText() === 'window.wp.i18n' || node.expression.expression.getText() === 'wp.i18n')
    ) {
      message = extractMessage(node.expression.name, node.arguments, null, locationMeta);
    }

    if (message != null) {
      message.translators = lastTranslators;
      lastTranslators = undefined;
      messages.push(message);
      return false;
    }
  });

  return messages;
}

/**
 * Extract translation data from a caller.
 *
 * @param caller Caller variable
 * @param args Arguments passed to caller
 * @returns A compiled message
 */
function extractMessage(
  caller: ts.LeftHandSideExpression | ts.MemberName,
  args: ts.NodeArray<ts.Expression>,
  imports: ts.Identifier[] | null,
  { source, filename }: { source: string; filename: string },
): TranslationMessage | null {
  let id = caller.getText();

  /**
   * This lookup is looking to see if the caller variable is a reference to a
   * named import, an import which was renamed (`import { __ as translate }`).
   * We have previously identified that import, that's why it ends up here.
   * And by looking at the imported variable we can find the "real" method that
   * it references.
   */
  if (Array.isArray(imports) && !isTranslatableMethod(id)) {
    let importVar = imports.find((imported) => imported.getText() === id);
    let parent = importVar?.parent;
    if (parent == null || !ts.isImportSpecifier(parent)) return null;
    id = parent.propertyName?.getText() ?? parent.name.getText();
  }

  if (!isTranslatableMethod(id)) return null;

  let location = tsNodeToLocation(caller, id, source, filename);

  switch (id) {
    case '_n':
      return {
        location,
        single: getStringValue(args[0]),
        plural: getStringValue(args[1]),
        domain: args[3] ? getStringValue(args[3]) : undefined,
      };

    case '_nx':
      return {
        location,
        single: getStringValue(args[0]),
        plural: getStringValue(args[1]),
        context: getStringValue(args[3]),
        domain: args[4] ? getStringValue(args[4]) : undefined,
      };

    case '__':
      return {
        location,
        text: getStringValue(args[0]),
        domain: args[1] ? getStringValue(args[1]) : undefined,
      };

    case '_x':
      return {
        location,
        text: getStringValue(args[0]),
        context: getStringValue(args[1]),
        domain: args[2] ? getStringValue(args[2]) : undefined,
      };
  }
}

/**
 * Extract all relevant imports from a named imports declaration. It will also
 * look for aliased imports (`import { __ as translate }`) and push those to the
 * relevant array.
 *
 * @param clause Named imports node
 */
function getRelevantNamedImports(clause: ts.NamedImports): ts.Identifier[] {
  let relevant: ts.Identifier[] = [];
  for (let specifier of clause.elements) {
    if (isTranslatableMethod(specifier.propertyName?.getText() ?? specifier.name.getText())) {
      relevant.push(specifier.name);
    }
  }

  return relevant;
}

/**
 * A function to traverse all children within a source file.
 *
 * @param source The source file to visit node within
 * @param callback A callback fired on each node. Return `false` to prevent going deeper.
 */
function visitAll(source: ts.SourceFile, callback: (node: ts.Node) => boolean | undefined | null | void) {
  function visit(node: ts.Node) {
    let shouldContinue = callback(node);
    if (shouldContinue !== false) {
      node.getChildren(source).forEach(visit);
    }
  }

  visit(source);
}

/**
 * Extract the string representation of a string literal (or string like
 * literal).
 *
 * @param expression String literal expression
 * @returns String representation of the expression, or throws an error if it is not a StringLiteral
 */
function getStringValue(expression: ts.Expression): string {
  if (ts.isStringLiteral(expression) || ts.isStringLiteralLike(expression)) {
    return expression.text;
  }

  throw new Error('Given expression is not a string literal.');
}

function getTranslatorComment(node: ts.Node, source: string): string | undefined {
  let comments = ts.getLeadingCommentRanges(source, node.pos);
  if (Array.isArray(comments)) {
    for (let commentNode of comments) {
      let comment = trimComment(source.substring(commentNode.pos, commentNode.end));
      if (isTranslatorsComment(comment)) return comment;
    }
  }

  return undefined;
}
