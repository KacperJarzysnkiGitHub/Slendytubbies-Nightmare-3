
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Access document via window to bypass the 'Cannot find name document' error in environments with missing global DOM types
const rootElement = (window as any).document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
