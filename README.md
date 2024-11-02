# swapswidget

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.tsx
```

This project was created using `bun init` in bun v1.1.33. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


Install dependencies
bun install
Run development server
bun dev
Build for production
bun build
typescript
import SwapsWidget from './components/SwapsWidget';
function App() {
return (
<SwapsWidget thorNodeUrl="https://thornode.ninerealms.com/thorchain" />
);
}
API
This setup gives you a minimal but complete React project using Bun that you can use to develop and test the SwapsWidget component in isolation. The widget will fetch real data from the THORNode API and display it with a clean, simple design.
To test it:
dev
Then open your browser to the URL shown in the terminal (usually http://localhost:3000).
