import { defineContentScript } from 'wxt/sandbox';
import { checkPageUnsupported } from '@refly-packages/ai-workspace-common/utils/extension/check';
import { checkBrowserArc } from '@/utils/browser';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode

  async main(ctx) {
    /**
     * 如果决定是否使用 SidePanel 还是 Content Script UI？
     *
     * 1. 如果页面支持 CSUI 注入，判断是否是 Arc，直接处理
     * 2. 如果不支持 CSUI 注入，比如 extension://url，则打开 Popup 要求跳转到支持页面，然后处理
     */
    if (!checkPageUnsupported(location.href)) {
      checkBrowserArc();
    }
  },
});
