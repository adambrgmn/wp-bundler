import { Text, Transform } from 'ink';
import React from 'react';

export const Link: React.FC<{ url: string }> = ({ url, children }) => {
  let supportsHyperlinks = process.stdout.isTTY && !('CI' in process.env);
  if (!supportsHyperlinks) {
    return <Text>nolink{children}</Text>;
  }

  return (
    <Transform transform={(children) => escapeLink(children, url)}>
      <Text>{children}</Text>
    </Transform>
  );
};

const OSC = '\u001B]';
const BEL = '\u0007';
const SEP = ';';

function escapeLink(text: string, url: string) {
  return [OSC, '8', SEP, SEP, url, BEL, text, OSC, '8', SEP, SEP, BEL].join('');
}
