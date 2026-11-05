// import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App.jsx';
// import './index.css';

// createRoot(document.getElementById('root')).render(
//   <React.StrictMode><App /></React.StrictMode>
// );
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found in index.html');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);