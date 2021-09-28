import { Location } from 'esbuild';
import ts from 'typescript';

export function nodeToLocation(
  node: ts.Node,
  source: string,
  file: string,
): Location {
  let substring = source.substr(0, node.pos);
  let lines = substring.split('\n');
  let line = lines.length;
  let column = lines[line - 1].length;

  return {
    file,
    namespace: '',
    line,
    column,
    length: 1,
    lineText: '',
    suggestion: '',
  };
}
