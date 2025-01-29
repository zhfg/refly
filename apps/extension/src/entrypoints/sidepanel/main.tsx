import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { MemoryRouter } from '@refly-packages/ai-workspace-common/utils/router';
import { setRuntime } from '@refly/utils/env';

setRuntime('extension-sidepanel');
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MemoryRouter>
      <App />
    </MemoryRouter>
  </React.StrictMode>,
);
