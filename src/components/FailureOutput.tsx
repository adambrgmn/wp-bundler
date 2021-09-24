import React, { Fragment } from 'react';
import { Box, Text } from 'ink';
import figures from 'figures';
import { ErrorCodeFrame } from './ErrorCodeFrame';
import { BuildFailure } from 'esbuild';

export const FailureOutput: React.FC<{
  message: string;
  error: BuildFailure | Error | null;
}> = ({ error, message }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="red">
          {figures.cross} {message}
        </Text>
      </Box>

      {error != null && 'errors' in error && (
        <Fragment>
          <Box marginBottom={1}>
            <Text>{error.errors.length} error(s) occured:</Text>
          </Box>
          <Box flexDirection="column">
            {error.errors.map((error, i) => (
              <Box key={i} marginBottom={1}>
                <ErrorCodeFrame error={error} />
              </Box>
            ))}
          </Box>
        </Fragment>
      )}
    </Box>
  );
};
