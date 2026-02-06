import React from 'react';
import { StackPanelProps, Alignment } from './types';

const mapAlignmentToFlex = (alignment: Alignment): string => {
  switch (alignment) {
    case 'start':
    case 'left':
    case 'top':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
    case 'right':
    case 'bottom':
      return 'flex-end';
    case 'stretch':
      return 'stretch';
    default:
      return 'stretch';
  }
};

export const StackPanel: React.FC<StackPanelProps> = ({
  orientation = 'vertical',
  spacing = 8,
  horizontalAlignment = 'stretch',
  verticalAlignment = 'stretch',
  margin,
  children,
  style,
  ...restProps
}) => {
  const isHorizontal = orientation === 'horizontal';
  
  const stackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    gap: typeof spacing === 'number' ? `${spacing}px` : spacing,
    justifyContent: isHorizontal ? mapAlignmentToFlex(verticalAlignment) : mapAlignmentToFlex(horizontalAlignment),
    alignItems: isHorizontal ? mapAlignmentToFlex(horizontalAlignment) : mapAlignmentToFlex(verticalAlignment),
    width: horizontalAlignment === 'stretch' ? '100%' : 'auto',
    height: verticalAlignment === 'stretch' ? '100%' : 'auto',
    margin: typeof margin === 'number' ? `${margin}px` : margin,
    ...style
  };

  return <div style={stackStyle} role="region" {...restProps}>{children}</div>;
};

export default StackPanel;
