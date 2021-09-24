import React, { Fragment } from 'react';
import { Box, Text } from 'ink';
import { Metafile } from 'esbuild';
import figures from 'figures';
import { Bundler } from '../bundler';
import { useWatchMode, WatchContext } from '../hooks/useWatchMode';
import { Spinner } from './Spinner';
import { CwdProvider } from '../hooks/useCwd';
import { ErrorCodeFrame } from './ErrorCodeFrame';

export interface WatchProps {
  bundler: Bundler;
  cwd: string;
}

export const Watch: React.FC<WatchProps> = ({ bundler, cwd }) => {
  const [state, events, start, stop] = useWatchMode(bundler);

  return (
    <CwdProvider cwd={cwd}>
      <Box marginBottom={5}>
        {state.matches('preparing') && (
          <SpinnerWithMessage message="Preparing bundler." />
        )}
        {state.matches('idle') && <Idle {...state.context} />}
        {state.matches('rebuilding') && (
          <SpinnerWithMessage message="Rebuilding project." />
        )}
        {state.matches('error') && (
          <Failure
            {...state.context}
            message="Build failed. Fix errors shown below."
          />
        )}
        {state.matches('unhandled') && (
          <Failure
            {...state.context}
            message={'Starting bundler failed. Press "r" to restart bundler.'}
          />
        )}
      </Box>
    </CwdProvider>
  );
};

const SpinnerWithMessage: React.FC<{ message: string }> = ({ message }) => {
  return (
    <Box>
      <Box marginRight={1}>
        <Spinner />
      </Box>
      <Text>{message}</Text>
    </Box>
  );
};

const Idle: React.FC<WatchContext> = ({ result }) => {
  let bundleData =
    result?.metafile != null ? extractBundleData(result.metafile) : null;
  return (
    <Box flexDirection="column">
      <Text color="green">{figures.tick} Build successful</Text>
      {bundleData != null && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          {Object.entries(bundleData).map(([key, files]) => (
            <Box key={key} flexDirection="column">
              <Box>
                <Text color="blue">{key}</Text>
              </Box>
              <Box paddingLeft={2}>
                <Text color="white">{files.join(', ')}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const Failure: React.FC<WatchContext & { message: string }> = ({
  error,
  message,
}) => {
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

function extractBundleData(metafile: Metafile) {
  let bundles: Record<string, string[]> = {};
  for (let key of Object.keys(metafile.outputs)) {
    let [filename] = key.split('/').slice(-1);
    if (!filename.endsWith('.js') && !filename.endsWith('.css')) continue;
    let [bundleName] = filename.split('.').slice(0, 1);
    bundles[bundleName] = bundles[bundleName] ?? [];
    bundles[bundleName].push(key);
  }

  return bundles;
}
