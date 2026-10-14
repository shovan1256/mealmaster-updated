import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker safely, and purge stale development workers
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Proactively clean up any stale development service workers that may cause white screens
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
  } else {
    try {
      registerSW({ immediate: true });
    } catch (err) {
      console.warn('PWA service worker registration note:', err);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
