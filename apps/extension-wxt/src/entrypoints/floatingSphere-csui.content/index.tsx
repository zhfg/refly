import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import { createShadowRootUi } from 'wxt/client';
import { App } from './App';

import { setRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',
  excludeMatches: ['https://refly.ai/*', 'https://api.refly.ai/*', 'https://www.refly.ai/*', 'http://localhost:5173/*'],

  async main(ctx) {
    setRuntime('extension-csui');

    console.log('ctx', ctx);
    let removeInjectCSS: () => void;
    // 3. Define your UI`
    const ui = await createShadowRootUi(ctx, {
      name: 'refly-float-sphere',
      position: 'inline',
      append: 'last',
      onMount(container) {
        // 渲染 selector
        const root = ReactDOM.createRoot(container);
        root.render(<App />);

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
