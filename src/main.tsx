import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GeotabLifecycle } from './lib/GeotabLifecycle';

if (typeof geotab !== 'undefined') {
  console.log("Running in Geotab Platform: Registering Geotab Event Hooks...")
  geotab.addin.AirfinderAddIn = GeotabLifecycle;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
