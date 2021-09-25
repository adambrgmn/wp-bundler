import React from 'react';
import { Box, Text } from 'ink';
import figures from 'figures';
import { Bundler } from '../bundler';
import { useWatchMode, WatchContext } from '../hooks/useWatchMode';
import { CwdProvider } from '../hooks/useCwd';
import { SpinnerWithMessage } from './SpinnerWithMessage';
import { BundleOutput } from './BundleOutput';
import { FailureOutput } from './FailureOutput';

export interface WatchProps {
  bundler: Bundler;
  cwd: string;
}

export const Watch: React.FC<WatchProps> = ({ bundler, cwd }) => {
  const [state] = useWatchMode(bundler);

  return (
    <CwdProvider cwd={cwd}>
      <Box>
        {state.matches('preparing') && (
          <SpinnerWithMessage message="Preparing bundler and performing initial build." />
        )}
        {state.matches('idle') && <Idle {...state.context} />}
        {state.matches('rebuilding') && (
          <SpinnerWithMessage message="Rebuilding project." />
        )}
        {state.matches('error') && (
          <FailureOutput
            error={state.context.error}
            message="Build failed. Fix errors shown below."
          />
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
      <Box paddingLeft={2}>
        {result != null && <BundleOutput metafile={result.metafile} />}
      </Box>
    </Box>
  );
};
