import React from 'react';
import spinners, { SpinnerName } from 'cli-spinners';
import { Text } from 'ink';
import { useEffect, useState } from 'react';

interface SpinnerProps extends React.ComponentProps<typeof Text> {
  spinner?: SpinnerName;
}

export const Spinner: React.FC<SpinnerProps> = ({ spinner = 'dots', ...rest }) => {
  const config = spinners[spinner];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let id = setInterval(() => {
      setFrame((prev) => {
        let next = prev + 1;
        if (next > config.frames.length - 1) next = 0;
        return next;
      });
    }, config.interval);

    return () => clearTimeout(id);
  }, [config]);

  return <Text {...rest}>{config.frames[frame]}</Text>;
};
