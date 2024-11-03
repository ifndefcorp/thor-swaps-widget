import SwapsWidget from './components/SwapsWidget';
import './styles/SwapsWidget.css';

function App() {
  // Example custom styles (optional)
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
    <div>
      <SwapsWidget styles={customStyles} />
    </div>
  );
}

export default App;