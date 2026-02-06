import React from 'react';

// ============================================================================
// Common Types
// ============================================================================

export type Orientation = 'horizontal' | 'vertical';

export type Dock = 'top' | 'left' | 'right' | 'bottom' | 'fill';

export type ScrollBarVisibility = 'auto' | 'visible' | 'hidden' | 'disabled';

// WPF-style alignment values
export type WpfAlignment = 'left' | 'center' | 'right' | 'stretch' | 'top' | 'bottom';

// CSS-style alignment values (for backward compatibility)
export type CssAlignment = 'start' | 'center' | 'end' | 'stretch';

// Unified alignment type supporting both WPF and CSS conventions
export type Alignment = WpfAlignment | CssAlignment;

// Grid definition types (WPF-style)
export type GridDefinition = number | '*' | 'auto' | `${number}fr`;

// ============================================================================
// Base Interfaces
// ============================================================================

/**
 * Base interface for all framework elements, providing common alignment and margin properties
 * Mirrors WPF's FrameworkElement class
 */
export interface FrameworkElementProps {
  /** Horizontal alignment within parent container */
  horizontalAlignment?: Alignment;
  /** Vertical alignment within parent container */
  verticalAlignment?: Alignment;
  /** Margin around the element (can be a single value or CSS shorthand) */
  margin?: number | string;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Props for the Root component
 * The root container for the application layout
 */
export interface RootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Whether the root should occupy full screen (default: true) */
  fullScreen?: boolean;
}

/**
 * Props for StackPanel component
 * Arranges child elements in a single line (stack)
 */
export interface StackPanelProps extends React.HTMLAttributes<HTMLDivElement>, FrameworkElementProps {
  /** Orientation of the stack (default: 'vertical') */
  orientation?: Orientation;
  /** Spacing between children (default: 8) */
  spacing?: number | string;
  children: React.ReactNode;
}

/**
 * Props for Grid component
 * Provides a flexible grid layout system
 */
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid column definitions (e.g., "1fr 1fr 1fr" or 3 for equal columns) */
  columns?: string | number;
  /** Grid row definitions (e.g., "auto 1fr auto") */
  rows?: string;
  /** Gap between grid cells (default: 8) */
  gap?: number | string;
  /** Grid auto-flow behavior (default: 'row') */
  autoFlow?: 'row' | 'column' | 'row dense' | 'column dense';
  children: React.ReactNode;
}

/**
 * Props for Grid child elements
 * Controls positioning and alignment within a Grid cell
 */
export interface GridChildProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Row position (1-indexed) */
  row?: number;
  /** Column position (1-indexed) */
  column?: number;
  /** Number of rows to span */
  rowSpan?: number;
  /** Number of columns to span */
  columnSpan?: number;
  /** Horizontal alignment within the grid cell */
  horizontalAlignment?: 'left' | 'center' | 'right' | 'stretch';
  /** Vertical alignment within the grid cell */
  verticalAlignment?: 'top' | 'center' | 'bottom' | 'stretch';
  children?: React.ReactNode;
}

/**
 * Props for DockPanel component
 * Arranges child elements along the edges of a panel
 */
export interface DockPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the last child without a dock prop fills remaining space (default: true) */
  lastChildFill?: boolean;
  children: React.ReactNode;
}

/**
 * Props for DockPanel child elements
 * Controls docking position for child elements
 */
export interface DockChildProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dock position for the element */
  dock?: Dock;
  children?: React.ReactNode;
}

/**
 * Props for ScrollViewer component
 * Provides scrollable content area with configurable scrollbars
 */
export interface ScrollViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Vertical scrollbar visibility (default: 'auto') */
  verticalScrollBarVisibility?: ScrollBarVisibility;
  /** Horizontal scrollbar visibility (default: 'disabled') */
  horizontalScrollBarVisibility?: ScrollBarVisibility;
  children: React.ReactNode;
}

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Helper type to check if an element is a dockable child of DockPanel
 */
export type DockableElement = React.ReactElement<DockChildProps>;

/**
 * Helper type to check if an element is a grid child
 */
export type GridChildElement = React.ReactElement<GridChildProps>;

/**
 * Helper type to check if an element has framework element properties
 */
export type FrameworkElement = React.ReactElement<FrameworkElementProps>;

/**
 * Type guard to check if a React element has a dock prop
 */
export function isDockableElement(element: React.ReactNode): element is DockableElement {
  if (!React.isValidElement(element)) return false;
  const props = element.props as Record<string, unknown>;
  return typeof props === 'object' && props !== null && 'dock' in props;
}

/**
 * Type guard to check if a React element has grid positioning props
 */
export function isGridChildElement(element: React.ReactNode): element is GridChildElement {
  if (!React.isValidElement(element)) return false;
  const props = element.props as Record<string, unknown>;
  return typeof props === 'object' && props !== null && 
    ('row' in props || 'column' in props || 'rowSpan' in props || 'columnSpan' in props);
}

/**
 * Type guard to check if a React element has framework element props
 */
export function isFrameworkElement(element: React.ReactNode): element is FrameworkElement {
  if (!React.isValidElement(element)) return false;
  const props = element.props as Record<string, unknown>;
  return typeof props === 'object' && props !== null && 
    ('horizontalAlignment' in props || 'verticalAlignment' in props || 'margin' in props);
}
