import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import errorReporter from './services/errorReporter';
import './index.css';

errorReporter.installGlobalHandlers();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
