import React from 'react';
import { RootProps } from './types';

export const Root: React.FC<RootProps> = ({ children, fullScreen = true, style }) => {
  const rootStyle: React.CSSProperties = {
    position: 'relative',
    width: fullScreen ? '100%' : '100%',
    height: fullScreen ? '100%' : '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
    ...style
  };

  return <div style={rootStyle} role="main">{children}</div>;
};

export default Root;
