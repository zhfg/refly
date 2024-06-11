import { BackgroundMessage } from '@refly/ai-workspace-common/utils/extension/messaging';
import { getCurrentTab } from '@refly/ai-workspace-common/utils/extension/tabs';
import { safeStringifyJSON } from '@refly/ai-workspace-common/utils/parse';
import { storage } from '@refly/ai-workspace-common/utils/storage';
import { ResourceDetail } from '@refly/openapi-schema';

// 存储 tab 相关的内容，包括 currentMockResource、未来存储 Tab 栈，模拟浏览器 Tab/主站知识库 Tab 做管理或同步
export interface TabStorage {
  currentMockResource: ResourceDetail;
}

// 按照 tabId_* 存储和处理
export const handleUpdateTabStorage = async (msg: BackgroundMessage) => {
  const lastActiveTab = await getCurrentTab();

  if (lastActiveTab?.id) {
    if (msg?.body) {
      await storage.setItem(`sync:${lastActiveTab?.id}_${msg?.name}`, safeStringifyJSON(msg?.body));
    } else {
      await storage.removeItem(`sync:${lastActiveTab?.id}_${msg?.name}`);
    }
  }
};

export const handleOperateTabStorage = async (msg: BackgroundMessage) => {
  if (msg?.name === 'currentMockResource') {
    handleUpdateTabStorage(msg);
  }
};
