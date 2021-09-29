import React, { useMemo } from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { Box, Text } from 'ink';
import filesize from 'filesize';
import { useCwd } from '../hooks/useCwd';
import { Metafile } from 'esbuild';

type BundlerOutput = Record<string, { file: string; size: number | null }[]>;

export const BundleOutput: React.FC<{
  metafile: Metafile;
  withSize?: boolean;
}> = ({ metafile, withSize }) => {
  const cwd = useCwd();

  const output = useMemo<BundlerOutput>(() => {
    let bundles: BundlerOutput = {};

    for (let key of Object.keys(metafile.outputs)) {
      let [filename] = key.split('/').slice(-1);
      if (!filename.endsWith('.js') && !filename.endsWith('.css')) continue;
      let [bundleName] = filename.split('.').slice(0, 1);

      let size: number | null = null;
      if (withSize) {
        let buffer = fs.readFileSync(path.join(cwd, key));
        size = buffer.length;
      }

      bundles[bundleName] = bundles[bundleName] ?? [];
      bundles[bundleName].push({ file: key, size });
    }

    return bundles;
  }, [metafile.outputs, withSize, cwd]);

  return (
    <Box flexDirection="column">
      {Object.entries(output).map(([key, files]) => (
        <Box key={key} flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="blue">{key}</Text>
          </Box>
          <Box paddingLeft={2} flexDirection="column">
            {files.map((file, i) => (
              <Box key={i}>
                <Text>{file.file}</Text>
                {file.size != null && <Text color="grey"> ({filesize(file.size)})</Text>}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};
