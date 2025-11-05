import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Leaflet CSS for map styling
import 'leaflet/dist/leaflet.css';
import { registerServiceWorker, initInstallPrompt, listenForUpdates } from './utils/pwa';

// Initialize PWA features
registerServiceWorker();
initInstallPrompt();
listenForUpdates();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
