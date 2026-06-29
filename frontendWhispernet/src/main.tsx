import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "next-themes"

// Polyfill for browser builds of simple-peer/randombytes that expect Node globals.
if (typeof window !== "undefined") {
  (window as any).global = window;
  (window as any).process = (window as any).process || { env: {} };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <App />
  </ThemeProvider>,
)
