import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GeotabLifecycle } from './lib/GeotabLifecycle';

// Instantiate GeotabLifecycle at the global namespace
geotab.addin.LinkLabsAddIn = GeotabLifecycle();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);