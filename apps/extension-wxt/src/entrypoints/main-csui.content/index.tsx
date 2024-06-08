import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import { createShadowRootUi } from 'wxt/client';

import App from './App';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',

  async main(ctx) {
    console.log('ctx', ctx);
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: 'refly-main-app',
      position: 'inline',
      append: 'before',
      onMount(container) {
        const elemContainer = document.createElement('div');
        elemContainer.id = 'refly-main-app';
        container.appendChild(elemContainer);

        const root = ReactDOM.createRoot(elemContainer);
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
