import React from 'react';
import {Root, DockPanel, Grid, StackPanel, ScrollViewer} from '../../layoutcomponents';

function LayoutDemo() {
  return (
      <Root fullScreen={false} style={{ width: '100%', height: '100%' }}>
          <DockPanel>
              <div dock="top" style={{ height: 80, background: '#ff5252', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  Top
              </div>
              <div dock="left" style={{ width: 120, background: '#448aff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <ScrollViewer verticalScrollBarVisibility="auto">
                      <StackPanel orientation="vertical" spacing={8}>
                          <p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p><p>hello</p>
                      </StackPanel>
                  </ScrollViewer>
              </div>
              <DockPanel style={{ width: 420}} dock="right">
                  <div dock="top" style={{ height: 8, background: '#ff0252', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Top
                  </div>
                  <div dock="left" style={{ width: 12, background: '#440aff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Left
                  </div>
                  <div dock="right" style={{ width: 12, background: '#6900ae', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Right
                  </div>
                  <div dock="bottom" style={{ height: 8, background: '#ff0740', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      Bottom
                  </div>
                  <div style={{ background: '#e10ee7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#4a148c' }}>
                      Center (Fill)
                  </div>
              </DockPanel>
              <div dock="bottom" style={{ height: 80, background: '#ffd740', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  Bottom
              </div>
              <div style={{ background: '#e1bee7' }}>
                  <Grid>
                      <StackPanel orientation="horizontal" spacing={12} horizontalAlignment="right" verticalAlignment="bottom">
                          <button>Annuler</button>
                          <button >Valider</button>
                      </StackPanel>
                      <StackPanel orientation="vertical" spacing={12} horizontalAlignment="center" verticalAlignment="center">
                          <button>centered</button>
                          <button>centered</button>
                      </StackPanel>
                      <button horizontalAlignment="left" verticalAlignment="bottom">bottom left button</button>
                      <button horizontalAlignment="right" verticalAlignment="top">top right button</button>
                  </Grid>
              </div>
          </DockPanel>
      </Root>
  );
}

export default LayoutDemo;
