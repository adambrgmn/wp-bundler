import React from 'react';
import { Box, Text } from 'ink';
import figures from 'figures';
import { Bundler } from '../bundler';
import { BuildContext, useBuildMode } from '../hooks/useBuildMode';
import { CwdProvider } from '../hooks/useCwd';
import { SpinnerWithMessage } from './SpinnerWithMessage';
import { BundleOutput } from './BundleOutput';
import { FailureOutput } from './FailureOutput';

export const Build: React.FC<{ bundler: Bundler; cwd: string }> = ({
  bundler,
  cwd,
}) => {
  const [state] = useBuildMode(bundler);
  return (
    <CwdProvider cwd={cwd}>
      <Box>
        {state.matches('preparing') && (
          <SpinnerWithMessage message="Preparing bundler." />
        )}
        {state.matches('building') && (
          <SpinnerWithMessage message="Building project." />
        )}
        {state.matches('success') && <Success {...state.context} />}

        {state.matches('error') && (
          <FailureOutput
            error={state.context.error}
            message="Failed to build project."
          />
        )}
      </Box>
    </CwdProvider>
  );
};

const Success: React.FC<BuildContext> = ({ result }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="green">{figures.tick} Succesfully built project.</Text>
      </Box>
      <Box paddingLeft={2}>
        {result != null && <BundleOutput metafile={result.metafile} withSize />}
      </Box>
    </Box>
  );
};
