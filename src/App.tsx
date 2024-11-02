import React from 'react';
import SwapsWidget from './components/SwapsWidget';
import './styles/SwapsWidget.css';

function App() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <h1>THORChain Streaming Swaps</h1>
      <SwapsWidget thorNodeUrl="https://thornode.ninerealms.com/thorchain" />
    </div>
  );
}

export default App;