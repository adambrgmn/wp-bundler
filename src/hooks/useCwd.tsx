import React, { createContext, useContext } from 'react';

const CwdContext = createContext(process.cwd());

export const CwdProvider: React.FC<{ cwd: string }> = ({ cwd, children }) => {
  return <CwdContext.Provider value={cwd}>{children}</CwdContext.Provider>;
};

export function useCwd() {
  return useContext(CwdContext);
}
