import React from 'react';
import { ScrollViewerProps, ScrollBarVisibility } from './types';

const mapVisibilityToOverflow = (visibility: ScrollBarVisibility): string => {
  switch (visibility) {
    case 'visible': return 'scroll';
    case 'hidden': return 'hidden';
    case 'disabled': return 'hidden';
    case 'auto':
    default: return 'auto';
  }
};

export const ScrollViewer: React.FC<ScrollViewerProps> = ({
  verticalScrollBarVisibility = 'auto',
  horizontalScrollBarVisibility = 'disabled',
  children,
  style
}) => {
  const scrollViewerStyle: React.CSSProperties = {
    overflowX: mapVisibilityToOverflow(horizontalScrollBarVisibility) as any,
    overflowY: mapVisibilityToOverflow(verticalScrollBarVisibility) as any,
    width: '100%',
    height: '100%',
    position: 'relative',
    ...style
  };

  const contentStyle: React.CSSProperties = {
    minWidth: 'fit-content',
    minHeight: 'fit-content'
  };

  return (
    <div style={scrollViewerStyle} className="scrollviewer" role="region" aria-label="Scrollable content">
      <div style={contentStyle}>{children}</div>
      <style>{`
        .scrollviewer::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .scrollviewer::-webkit-scrollbar-track {
          background: #2d2d2d;
          border-radius: 6px;
        }
        .scrollviewer::-webkit-scrollbar-thumb {
          background: #5a5a5a;
          border-radius: 6px;
          border: 2px solid #2d2d2d;
        }
        .scrollviewer::-webkit-scrollbar-thumb:hover {
          background: #6a6a6a;
        }
        .scrollviewer::-webkit-scrollbar-corner {
          background: #2d2d2d;
        }
      `}</style>
    </div>
  );
};

export default ScrollViewer;
