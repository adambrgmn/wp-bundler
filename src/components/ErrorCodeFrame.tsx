import React from 'react';
import * as path from 'path';
import * as fs from 'fs';
import { Message } from 'esbuild';
import { codeFrameColumns } from '@babel/code-frame';
import { Box, Text } from 'ink';
import Link from 'ink-link';
import figures from 'figures';
import { useCwd } from '../hooks/useCwd';

export const ErrorCodeFrame: React.FC<{ error: Message }> = ({ error }) => {
  const cwd = useCwd();
  if (error.location != null) {
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

    return (
      <Box flexDirection="column">
        <Text>
          {figures.circle} Error in{' '}
          <Link url={`file://${sourcePath}`} fallback={false}>
            {location.file}
          </Link>
          :
        </Text>
        <Box flexDirection="column">
          {frame.split('\n').map((line, i) => (
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
          {figures.circle} Error in <Text color="blue">{error.pluginName}</Text>{' '}
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
