import SwapsWidget from './components/SwapsWidget';
import './styles/SwapsWidget.css';

function App() {
  const customStyles = {
    fonts: {
      titleFont: 'Georgia, serif',
      bodyFont: 'Arial, sans-serif',
      detailFont: 'Consolas, monospace',
    },
    colors: {
      primaryText: '#333',
      secondaryText: '#666',
    },
    cornerRadius: '12px',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <SwapsWidget styles={customStyles} />
    </div>
  );
}

export default App;