import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts', 'Root.tsx', 'StackPanel.tsx', 'Grid.tsx', 'DockPanel.tsx', 'ScrollViewer.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
});
