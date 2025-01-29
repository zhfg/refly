import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { setRuntime } from '@refly/utils/env';

setRuntime('extension-popup');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
