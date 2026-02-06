# @kikipoulet/react-dotnetxaml-layouts

React layout components inspired by WPF XAML. These components provide a familiar layout system for React applications, similar to WPF's layout panels.

## Installation

```bash
npm install @kikipoulet/react-dotnetxaml-layouts
```

## Components

### Root
A root container component that provides a full-screen or fixed-size container for your layout.

```tsx
import { Root } from '@kikipoulet/react-dotnetxaml-layouts';

<Root fullScreen={true}>
  <YourContent />
</Root>
```

**Props:**
- `children` (ReactNode): Content to display
- `fullScreen?` (boolean): Whether the root should be full screen (default: true)
- `style?` (CSSProperties): Additional inline styles

---

### StackPanel
Arranges child elements in a single line that can be oriented horizontally or vertically.

```tsx
import { StackPanel } from '@kikipoulet/react-dotnetxaml-layouts';

<StackPanel orientation="vertical" spacing={10}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StackPanel>
```

**Props:**
- `orientation?` ('horizontal' | 'vertical'): Layout direction (default: 'vertical')
- `spacing?` (number | string): Space between items (default: 8px)
- `horizontalAlignment?` ('start' | 'center' | 'end' | 'stretch'): Horizontal alignment (default: 'stretch')
- `verticalAlignment?` ('start' | 'center' | 'end' | 'stretch'): Vertical alignment (default: 'start')
- `children` (ReactNode): Content to display
- `style?` (CSSProperties): Additional inline styles

---

### Grid
A flexible grid layout that allows you to arrange elements in rows and columns.

```tsx
import { Grid } from '@kikipoulet/react-dotnetxaml-layouts';

<Grid columns="1fr 1fr 1fr" gap={10}>
  <div column={1}>Header</div>
  <div column={2}>Content</div>
  <div column={3}>Sidebar</div>
</Grid>

<Grid >
    <StackPanel orientation="horizontal" spacing={12} horizontalAlignment="right" verticalAlignment="bottom">
        <button>Cancel</button>
        <button >OK</button>
    </StackPanel>
</Grid>
```

**Props:**
- `columns?` (string | number): Grid template columns (default: '1fr')
- `rows?` (string): Grid template rows (default: 'auto')
- `gap?` (number | string): Gap between grid cells (default: 0)
- `autoFlow?` ('row' | 'column' | 'row dense'): Grid auto-flow algorithm (default: 'row')
- `children` (ReactNode): Content to display
- `style?` (CSSProperties): Additional inline styles

---

### DockPanel
A layout panel that arranges child elements along the edges of the panel.

```tsx
import { DockPanel } from '@kikipoulet/react-dotnetxaml-layouts';

<DockPanel >
  <div dock="top">Header</div>
  <div dock="bottom">Footer</div>
  <div dock="left">Sidebar</div>
  <div>Main Content</div>
</DockPanel>
```

**Props:**
- `lastChildFill?` (boolean): Whether the last child fills remaining space (default: true)
- `children` (ReactNode): Content to display
- `style?` (CSSProperties): Additional inline styles

**Child Props (DockChild):**
- `dock?` ('top' | 'left' | 'right' | 'bottom'): Edge to dock to
- `children?` (ReactNode): Child content
- `style?` (CSSProperties): Additional inline styles

---

### ScrollViewer
A scrollable container that provides scrollbars for its content.

```tsx
import { ScrollViewer } from '@kikipoulet/react-dotnetxaml-layouts';

<ScrollViewer 
  verticalScrollBarVisibility="auto"
  horizontalScrollBarVisibility="auto"
>
  <div style={{ height: '2000px' }}>
    Long content...
  </div>
</ScrollViewer>
```

**Props:**
- `verticalScrollBarVisibility?` ('auto' | 'visible' | 'hidden' | 'disabled'): Vertical scrollbar visibility (default: 'auto')
- `horizontalScrollBarVisibility?` ('auto' | 'visible' | 'hidden' | 'disabled'): Horizontal scrollbar visibility (default: 'auto')
- `children` (ReactNode): Content to display
- `style?` (CSSProperties): Additional inline styles

---

## Complete Example

```tsx
import React from 'react';
import { Root, StackPanel, Grid, DockPanel, ScrollViewer } from '@kikipoulet/react-dotnetxaml-layouts';

function App() {
  return (
    <Root>
      <DockPanel lastChildFill={true}>
        <div dock="top" style={{ padding: '10px', background: '#f0f0f0' }}>
          <h1>My App</h1>
        </div>
        <div dock="left" style={{ width: '200px', background: '#e0e0e0' }}>
          <StackPanel spacing={10}>
            <div>Menu Item 1</div>
            <div>Menu Item 2</div>
            <div>Menu Item 3</div>
          </StackPanel>
        </div>
        <ScrollViewer>
          <StackPanel spacing={20} style={{ padding: '20px' }}>
            <div>Content 1</div>
            <div>Content 2</div>
            <div>Content 3</div>
          </StackPanel>
        </ScrollViewer>
      </DockPanel>
    </Root>
  );
}

export default App;
```

## License

MIT

## Author

kikipoulet
