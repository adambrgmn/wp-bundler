import React from 'react';

export const Button: React.FC = ({ children }) => {
  return (
    <button
      onClick={() => {
        // @ts-ignore
        console.log(process.env.NODE_ENV, __DEV__);
      }}
    >
      {children}
    </button>
  );
};
