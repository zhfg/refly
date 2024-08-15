import { tempTabState } from '@/entrypoints/background';
import { BackgroundMessage } from '@refly/common-types';
import { getCurrentTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';
import { safeStringifyJSON } from '@refly-packages/ai-workspace-common/utils/parse';
import { storage } from '@refly-packages/ai-workspace-common/utils/storage';
import { Resource } from '@refly/openapi-schema';

// 存储 tab 相关的内容，包括 currentMockResource、未来存储 Tab 栈，模拟浏览器 Tab/主站知识库 Tab 做管理或同步
export interface TabStorage {
  currentMockResource: Resource;
}

// 按照 tabId_* 存储和处理
export const handleUpdateTabStorage = async (msg: BackgroundMessage, tabId?: number) => {
  const lastActiveTab = await getCurrentTab();
  const actualTabId = tabId || lastActiveTab?.id;

  if (actualTabId) {
    if (msg?.body) {
      tempTabState[`${actualTabId}_${msg?.name}`] = safeStringifyJSON(msg?.body);
    } else {
      delete tempTabState[`${actualTabId}_${msg?.name}`];
    }
  }
};

export const handleOperateTabStorage = async (msg: BackgroundMessage) => {
  if (msg?.name === 'currentMockResource') {
    handleUpdateTabStorage(msg);
  }
};
