import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: white; background: #990000; position: fixed; inset: 0; z-index: 99999; font-family: monospace; overflow: auto; text-align: left;">
        <h3 style="margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 10px;">JavaScript Runtime Error</h3>
        <p style="font-size: 16px; font-weight: bold;">${event.message}</p>
        <p style="font-size: 14px; color: #ffcccc;">Source: ${event.filename}:${event.lineno}:${event.colno}</p>
        <pre style="margin-top: 20px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 4px; white-space: pre-wrap; word-break: break-all;">${event.error?.stack || 'No stack trace available'}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #990000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Reload Page</button>
      </div>
    `;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
