import React, { Fragment } from 'react';
import { Box, Text } from 'ink';
import figures from 'figures';
import { ErrorCodeFrame } from './ErrorCodeFrame';
import { BuildFailure, BuildResult } from 'esbuild';

export const FailureOutput: React.FC<{
  message: string;
  error: unknown | null;
}> = ({ error, message }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="red">
          {figures.cross} {message}
        </Text>
      </Box>

      <ErrorOutput error={error} />
    </Box>
  );
};

const ErrorOutput: React.FC<{ error: unknown }> = ({ error }) => {
  if (isBuildFailure(error)) {
    return <BuildFailureOutput result={error} />;
  }

  if (isError(error)) {
    return (
      <Fragment>
        <Box marginBottom={1}>
          <Text>An error was thrown:</Text>
        </Box>
        <Box flexDirection="column">
          <Text color="red">{error.message}</Text>
          <Text>{error.stack ?? 'No stack trace.'}</Text>
        </Box>
      </Fragment>
    );
  }

  let output: string;
  try {
    output = JSON.stringify(error, null, 2);
  } catch (_) {
    try {
      output = (error as any).toString();
    } catch (__) {
      output = 'Could not stringify error properly.';
    }
  }

  return (
    <Fragment>
      <Box marginBottom={1}>
        <Text>An unknown error occured. Trying to parse the output below:</Text>
      </Box>
      <Box flexDirection="column">
        <Text>{output}</Text>
      </Box>
    </Fragment>
  );
};

export const BuildFailureOutput: React.FC<{
  result: BuildFailure | BuildResult;
}> = ({ result }) => {
  let errorsCount = result.errors.length;
  let warningsCount = result.warnings.length;

  return (
    <Fragment>
      {errorsCount > 0 && (
        <Fragment>
          <Box marginBottom={1}>
            <Text color="red">{result.errors.length} build error(s) occured:</Text>
          </Box>
          <Box flexDirection="column">
            {result.errors.map((error, i) => (
              <Box key={i} marginBottom={1}>
                <ErrorCodeFrame error={error} level="error" />
              </Box>
            ))}
          </Box>
        </Fragment>
      )}
      {warningsCount > 0 && (
        <Fragment>
          <Box marginBottom={1}>
            <Text color="yellow">{result.warnings.length} build warning(s) occured:</Text>
          </Box>
          <Box flexDirection="column">
            {result.warnings.map((warning, i) => (
              <Box key={i} marginBottom={1}>
                <ErrorCodeFrame error={warning} level="warning" />
              </Box>
            ))}
          </Box>
        </Fragment>
      )}
    </Fragment>
  );
};

function isBuildFailure(value: any): value is BuildFailure {
  return value != null && ('errors' in value || 'warnings' in value);
}

function isError(value: any): value is Error {
  return value != null && value instanceof Error;
}
