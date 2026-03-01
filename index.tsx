
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// SAFETY: Service Worker Cleanup
if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations()
      .then(regs => {
        for (const reg of regs) {
          reg.unregister().catch(() => {});
        }
      })
      .catch(err => console.debug("SW cleanup skipped", err));
  } catch (e) {}
}

const root = ReactDOM.createRoot(rootElement);

// 🔥 CRITICAL: AuthProvider MUST wrap App for useAuth() to work
root.render(
  <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
);
