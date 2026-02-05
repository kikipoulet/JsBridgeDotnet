import React from 'react';

export type Orientation = 'horizontal' | 'vertical';

export type Alignment = 'start' | 'center' | 'end' | 'stretch';

export type Dock = 'top' | 'left' | 'right' | 'bottom';

export interface RootProps {
  children: React.ReactNode;
  fullScreen?: boolean;
  style?: React.CSSProperties;
}

export interface StackPanelProps {
  orientation?: Orientation;
  spacing?: number | string;
  horizontalAlignment?: Alignment;
  verticalAlignment?: Alignment;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export interface GridProps {
  columns?: string | number;
  rows?: string;
  gap?: number | string;
  autoFlow?: 'row' | 'column' | 'row dense';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export interface GridChildProps {
  row?: number;
  column?: number;
  rowSpan?: number;
  columnSpan?: number;
  horizontalAlignment?: 'left' | 'center' | 'right' | 'stretch';
  verticalAlignment?: 'top' | 'center' | 'bottom' | 'stretch';
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface DockPanelProps {
  lastChildFill?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export interface DockChildProps {
  dock?: Dock;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
