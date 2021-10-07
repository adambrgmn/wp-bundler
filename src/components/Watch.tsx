import React from 'react';
import { Box, Text } from 'ink';
import { figures } from '../utils/figures';
import { Bundler } from '../bundler';
import { useWatchMode, WatchContext } from '../hooks/useWatchMode';
import { CwdProvider } from '../hooks/useCwd';
import { SpinnerWithMessage } from './SpinnerWithMessage';
import { BundleOutput } from './BundleOutput';
import { BuildFailureOutput, FailureOutput } from './FailureOutput';
import { Server } from '../server';

export interface WatchProps {
  bundler: Bundler;
  server: Server;
  cwd: string;
}

export const Watch: React.FC<WatchProps> = ({ bundler, server, cwd }) => {
  const [state] = useWatchMode({ bundler, server });

  return (
    <CwdProvider cwd={cwd}>
      <Box>
        {state.matches('preparing') && <SpinnerWithMessage message="Preparing bundler and performing initial build." />}
        {state.matches('idle') && <Idle {...state.context} />}
        {state.matches('rebuilding') && <SpinnerWithMessage message="Rebuilding project." />}
        {state.matches('error') && (
          <FailureOutput error={state.context.error} message="Build failed. Fix errors shown below." />
        )}
        {state.matches('unhandled') && (
          <FailureOutput
            error={state.context.error}
            message={'Starting bundler failed. Press "r" to restart bundler.'}
          />
        )}
      </Box>
    </CwdProvider>
  );
};

const Idle: React.FC<WatchContext> = ({ result }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="green">{figures.tick} Succesfully built project.</Text>
      </Box>
      <Box paddingLeft={2} marginBottom={1}>
        {result != null && <BundleOutput metafile={result.metafile} />}
      </Box>
      {result != null && <BuildFailureOutput result={result} />}
    </Box>
  );
};
