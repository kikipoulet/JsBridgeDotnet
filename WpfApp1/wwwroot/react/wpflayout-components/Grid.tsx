import React from 'react';
import { GridProps, GridChildProps } from './types';

const mapHorizontalAlignment = (alignment: GridChildProps['horizontalAlignment']): string => {
  switch (alignment) {
    case 'left': return 'start';
    case 'center': return 'center';
    case 'right': return 'end';
    case 'stretch': return 'stretch';
    default: return 'stretch';
  }
};

const mapVerticalAlignment = (alignment: GridChildProps['verticalAlignment']): string => {
  switch (alignment) {
    case 'top': return 'start';
    case 'center': return 'center';
    case 'bottom': return 'end';
    case 'stretch': return 'stretch';
    default: return 'stretch';
  }
};

export const Grid: React.FC<GridProps> = ({
  columns = '1fr',
  rows = 'auto',
  gap = 8,
  autoFlow = 'row',
  children,
  style
}) => {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
    gridTemplateRows: rows,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    gridAutoFlow: autoFlow,
    width: '100%',
    height: '100%',
    ...style
  };

  const processedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    
    const childProps = child.props as GridChildProps;
    const hasGridPosition = childProps.row !== undefined || childProps.column !== undefined;
    
    const gridRow = childProps.rowSpan && childProps.row 
      ? `${childProps.row} / span ${childProps.rowSpan}` 
      : childProps.row?.toString();
    const gridColumn = childProps.columnSpan && childProps.column 
      ? `${childProps.column} / span ${childProps.columnSpan}` 
      : childProps.column?.toString();
    
    const childStyle: React.CSSProperties = {
      ...childProps.style
    };
    
    // Si pas de positionnement explicite, forcer dans la cellule (1,1) comme WPF
    if (!gridRow && !gridColumn) {
      childStyle.gridArea = '1 / 1 / 2 / 2';
    }
    
    if (gridRow) childStyle.gridRow = gridRow;
    if (gridColumn) childStyle.gridColumn = gridColumn;
    
    // Appliquer les alignements si positionnement explicite OU si alignment défini
    if (hasGridPosition || childProps.horizontalAlignment || childProps.verticalAlignment) {
      childStyle.justifySelf = mapHorizontalAlignment(childProps.horizontalAlignment ?? 'stretch');
      childStyle.alignSelf = mapVerticalAlignment(childProps.verticalAlignment ?? 'stretch');
    }

    return React.cloneElement(child, { style: childStyle } as GridChildProps);
  });

  return <div style={gridStyle} role="grid">{processedChildren}</div>;
};

export default Grid;
