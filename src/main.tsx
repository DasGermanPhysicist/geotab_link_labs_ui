import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GeotabLifecycle } from './GeotabLifecycle.ts';
import { runningInGeotab } from './lib/geotab.ts';


if (runningInGeotab()) {
  console.log("Running in Geotab Platform: Registering Geotab Event Hooks...")
  geotab.addin.AirfinderAddIn = GeotabLifecycle;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
