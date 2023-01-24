import type { Location } from 'esbuild';
import type { Node as PhpNode } from 'php-parser';
import type { Node as TsNode } from 'typescript';

export function phpNodeToLocation(node: PhpNode, file: string): Location {
  return {
    file,
    namespace: '',
    line: node.loc?.start.line ?? 1,
    column: node.loc?.start.column ?? 0,
    length: 0,
    lineText: '',
    suggestion: '',
  };
}

export function tsNodeToLocation(node: TsNode, fnName: string, source: string, file: string): Location {
  let pos = source.indexOf(fnName, node.pos);
  let substring = source.substr(0, pos);
  let lines = substring.split('\n');
  let line = lines.length;
  let column = lines[line - 1].length;

  return {
    file,
    namespace: '',
    line,
    column,
    length: 0,
    lineText: '',
    suggestion: '',
  };
}

export function trimComment(value: string): string {
  let lines = value.split('\n').map((line) => {
    return (
      line
        .trim()
        // //
        .replace(/^\/\//, '')
        // /*
        .replace(/^\/\*+/, '')
        // *
        .replace(/\*+\/$/, '')
        // */
        .replace(/^\*+/, '')
        .trim()
    );
  });

  return lines.filter(Boolean).join('\n');
}

export function isTranslatorsComment(comment: string): comment is `translators:${string}` {
  return comment.toLowerCase().startsWith('translators:');
}
