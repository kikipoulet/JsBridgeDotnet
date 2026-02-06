import React from 'react';
import { DockPanelProps, DockChildProps, Dock } from './types';

export const DockPanel: React.FC<DockPanelProps> = ({
  lastChildFill = true,
  children,
  style,
  ...restProps
}) => {
  const dockStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    ...style
  };

  const childrenArray = React.Children.toArray(children);
  const topElements: React.ReactElement[] = [];
  const bottomElements: React.ReactElement[] = [];
  const leftElements: React.ReactElement[] = [];
  const rightElements: React.ReactElement[] = [];
  let fillElement: React.ReactElement | null = null;
  const middleElements: React.ReactElement[] = [];

  childrenArray.forEach((child, index) => {
    if (!React.isValidElement(child)) return;
    
    const childProps = child.props as DockChildProps;
    const isLastChild = index === childrenArray.length - 1;
    const hasDockProp = childProps.dock !== undefined;
    
    if (hasDockProp) {
      const dock = childProps.dock as Dock;
      const childStyle: React.CSSProperties = { ...childProps.style };
      
      if (dock === 'top' || dock === 'bottom') {
        childStyle.width = '100%';
        childStyle.flexShrink = 0;
      } else {
        childStyle.flexShrink = 0;
      }
      
      const clonedChild = React.cloneElement(child, { style: childStyle } as DockChildProps);
      
      if (dock === 'top') topElements.push(clonedChild);
      else if (dock === 'bottom') bottomElements.push(clonedChild);
      else if (dock === 'left') leftElements.push(clonedChild);
      else if (dock === 'right') rightElements.push(clonedChild);
    } else if (lastChildFill && isLastChild && !fillElement) {
      fillElement = React.cloneElement(child, { 
        style: { flex: 1, ...childProps.style } 
      } as DockChildProps);
    } else {
      middleElements.push(child as React.ReactElement);
    }
  });

  const middleRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    minHeight: 0
  };

  const centerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  };

  return (
    <div style={dockStyle} role="region" {...restProps}>
      {topElements}
      <div style={middleRowStyle}>
        {leftElements}
        <div style={centerStyle}>
          {middleElements}
          {fillElement}
        </div>
        {rightElements}
      </div>
      {bottomElements}
    </div>
  );
};

export default DockPanel;
