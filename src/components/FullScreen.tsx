import { Box, useStdout } from 'ink';
import React, { useEffect, useState } from 'react';

type Props = Omit<React.ComponentProps<typeof Box>, 'width' | 'height'>;

export const FullScreen: React.FC<Props> = ({ children, ...box }) => {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    columns: stdout?.columns,
    rows: stdout?.rows,
  });

  useEffect(() => {
    function onResize() {
      setSize({
        columns: stdout?.columns,
        rows: stdout?.rows,
      });
    }

    stdout?.on('resize', onResize);
    stdout?.write('\x1b[?1049h');
    return () => {
      stdout?.off('resize', onResize);
      stdout?.write('\x1b[?1049l');
    };
  }, [stdout]);

  return (
    <Box {...box} width={size.columns} height={size.rows}>
      {children}
    </Box>
  );
};
