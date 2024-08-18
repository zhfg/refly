import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { MemoryRouter } from '@refly-packages/ai-workspace-common/utils/router';
import { setRuntime } from '@refly-packages/ai-workspace-common/utils/env.ts';

setRuntime('extension-sidepanel');
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MemoryRouter>
      <App />
    </MemoryRouter>
  </React.StrictMode>,
);
