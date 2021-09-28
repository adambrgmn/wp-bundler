import React from 'react';
import * as path from 'path';
import * as fs from 'fs';
import { Location, Message } from 'esbuild';
import { codeFrameColumns } from '@babel/code-frame';
import { Box, Text } from 'ink';
import Link from 'ink-link';
import figures from 'figures';
import { useCwd } from '../hooks/useCwd';

export const ErrorCodeFrame: React.FC<{
  error: Message;
  level: 'error' | 'warning';
}> = ({ error, level }) => {
  const cwd = useCwd();
  let frame = getFrame(error, cwd);
  let prefix = level === 'error' ? 'Error in' : 'Warning in';

  if (frame != null) {
    return (
      <Box flexDirection="column">
        <Text>
          {figures.circle} {prefix}{' '}
          <Link url={`file://${frame.sourcePath}`} fallback={false}>
            {frame.location.file}
          </Link>
          :
        </Text>
        <Box flexDirection="column">
          {frame.text.split('\n').map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {error.pluginName ? (
        <Text>
          {figures.circle} {prefix} <Text color="blue">{error.pluginName}</Text>{' '}
          plugin:
        </Text>
      ) : (
        <Text>{figures.circle} Unknown error:</Text>
      )}

      <Box flexDirection="column" paddingLeft={2}>
        <Box marginBottom={1}>
          <Text>{error.text}</Text>
        </Box>
        {error.notes.map((note, i) => (
          <Box marginBottom={1} key={i}>
            <Text>{note.text}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

function getFrame(
  error: Message,
  cwd: string,
): { text: string; location: Location; sourcePath: string } | null {
  if (error.location == null) return null;

  try {
    let { location } = error;
    let sourcePath = path.join(cwd, location.file.replace(cwd, ''));
    let source = fs.readFileSync(sourcePath, 'utf-8');
    let sourceLocation = {
      start: { line: error.location.line, column: error.location.column },
    };
    let frame = codeFrameColumns(source, sourceLocation, {
      highlightCode: true,
      message: error.text,
    });

    return { text: frame, location, sourcePath };
  } catch (error) {
    return null;
  }
}
