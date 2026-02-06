import React from 'react';

type Orientation = 'horizontal' | 'vertical';
type Alignment = 'start' | 'center' | 'end' | 'stretch';
type Dock = 'top' | 'left' | 'right' | 'bottom';
interface RootProps {
    children: React.ReactNode;
    fullScreen?: boolean;
    style?: React.CSSProperties;
}
interface StackPanelProps {
    orientation?: Orientation;
    spacing?: number | string;
    horizontalAlignment?: Alignment;
    verticalAlignment?: Alignment;
    children: React.ReactNode;
    style?: React.CSSProperties;
}
interface GridProps {
    columns?: string | number;
    rows?: string;
    gap?: number | string;
    autoFlow?: 'row' | 'column' | 'row dense';
    children: React.ReactNode;
    style?: React.CSSProperties;
}
interface GridChildProps {
    row?: number;
    column?: number;
    rowSpan?: number;
    columnSpan?: number;
    horizontalAlignment?: 'left' | 'center' | 'right' | 'stretch';
    verticalAlignment?: 'top' | 'center' | 'bottom' | 'stretch';
    style?: React.CSSProperties;
    children?: React.ReactNode;
}
interface DockPanelProps {
    lastChildFill?: boolean;
    children: React.ReactNode;
    style?: React.CSSProperties;
}
interface DockChildProps {
    dock?: Dock;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}
type ScrollBarVisibility = 'auto' | 'visible' | 'hidden' | 'disabled';
interface ScrollViewerProps {
    verticalScrollBarVisibility?: ScrollBarVisibility;
    horizontalScrollBarVisibility?: ScrollBarVisibility;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export type { Alignment as A, Dock as D, GridChildProps as G, Orientation as O, RootProps as R, ScrollBarVisibility as S, DockChildProps as a, DockPanelProps as b, GridProps as c, ScrollViewerProps as d, StackPanelProps as e };
