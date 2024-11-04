# THORChain Streaming Swaps Widget

A React widget for displaying THORChain swaps in real-time.

## Installation

```bash
npm install thorchain-streaming-swaps-widget
# or
yarn add thorchain-streaming-swaps-widget
```

## Quick Start

### 1. Basic Usage

```tsx
import { SwapsWidget } from 'thorchain-streaming-swaps-widget';
import 'thorchain-streaming-swaps-widget/dist/style.css';

function App() {
  // This is a completely self contained react widget, but styles are still injectable!
  return <SwapsWidget />;
}
```

### 2. Customized Usage

```tsx
import { SwapsWidget } from 'thorchain-streaming-swaps-widget';
// You don't have to import my style sheets if you want to reuse your own.
import 'thorchain-streaming-swaps-widget/dist/style.css';

function App() {
  // Style sheet uses semantic styling so that it can match any project easily
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <SwapsWidget styles={customStyles} />
    </div>
  );
}
```

## Styling Options

The widget accepts a `styles` prop with the following configuration options:

```typescript
interface SwapsWidgetStyles {
  fonts?: {
    titleFont?: string;    // Font for titles
    bodyFont?: string;     // Font for main content
    detailFont?: string;   // Font for detail text
  };
  colors?: {
    primaryText?: string;  // Main text color
    secondaryText?: string; // Secondary text color
  };
  cornerRadius?: string;   // Border radius for containers
}
```

## Features

- Real-time streaming swap updates
- Automatic USD value calculation
- Progress tracking for each swap
- ETA calculations
- Transaction links to THORChain explorer
- Responsive design
- Customizable styling

## Development

To contribute or modify the widget:

```bash
# Clone the repository
git clone https://github.com/rorallo/thorchain-streaming-swaps-widget.git

# Install dependencies
bun install

# Start development server
bun dev

# Build the library
bun build:lib

# Preview the build
bun preview
```

## Requirements

- React 18+
- Bun 1.0+

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.
