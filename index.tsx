
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// SAFETY: Unregister any existing service workers to ensure clients get the latest version immediately.
if ('serviceWorker' in navigator) {
  // Wrap in robust error handling to prevent "document is in an invalid state" crashes
  // which can occur during redirects, reloads, or in specific iframe contexts.
  try {
    navigator.serviceWorker.getRegistrations()
      .then(regs => {
        for (const reg of regs) {
          reg.unregister().catch(() => {}); // Ignore individual unregister errors
        }
      })
      .catch(err => {
        console.debug("Service Worker cleanup skipped:", err);
      });
  } catch (e) {
    console.debug("Service Worker API unavailable:", e);
  }
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
