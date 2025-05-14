
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add jQuery from CDN
const jQueryScript = document.createElement('script');
jQueryScript.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
jQueryScript.integrity = 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=';
jQueryScript.crossOrigin = 'anonymous';
document.head.appendChild(jQueryScript);

createRoot(document.getElementById("root")!).render(<App />);
