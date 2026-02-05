import React from 'react';
import { Root } from './Root';
import { StackPanel } from './StackPanel';
import { Grid } from './Grid';
import { DockPanel } from './DockPanel';

const App: React.FC = () => {
  return (
    <Root fullScreen style={{ background: '#f5f5f5' }}>
      <DockPanel>
        <div dock="top" style={{ padding: 16, background: '#1976d2', color: 'white' }}>
          Header
        </div>
        <div dock="left" style={{ width: 240, background: '#e3f2fd', padding: 16 }}>
          Sidebar
        </div>
        <div dock="right" style={{ width: 320, background: '#f3e5f5', padding: 16 }}>
          Panneau droit
        </div>
        <Grid columns="1fr 2fr 1fr" rows="auto 1fr auto" gap={16} style={{ padding: 24 }}>
          <div row={1} column={1} horizontalAlignment="center" verticalAlignment="center">
            Logo centré
          </div>
          <div row={1} column={3} horizontalAlignment="right" verticalAlignment="stretch">
            <button style={{ height: '100%' }}>Action</button>
          </div>
          <div row={2} column={1} columnSpan={3} horizontalAlignment="stretch" verticalAlignment="stretch" style={{ background: 'white', padding: 20 }}>
            Contenu principal qui remplit toute la zone
            <StackPanel orientation="horizontal" spacing={12} horizontalAlignment="center">
              <button>Annuler</button>
              <button style={{ background: '#4caf50', color: 'white' }}>Valider</button>
            </StackPanel>
          </div>
          <div row={3} column={1} columnSpan={3}>
            Footer de la grille
          </div>
        </Grid>
        <div dock="bottom" style={{ padding: 12, background: '#424242', color: 'white', textAlign: 'center' }}>
          Footer global
        </div>
      </DockPanel>
    </Root>
  );
};

export default App;
