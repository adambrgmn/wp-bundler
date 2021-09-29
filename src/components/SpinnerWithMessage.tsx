import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from './Spinner';

export const SpinnerWithMessage: React.FC<{ message: string }> = ({
  message,
}) => {
  return (
    <Box>
      <Box marginRight={1}>
        <Spinner />
      </Box>
      <Text>{message}</Text>
    </Box>
  );
};
