import { handleRequestReflect } from '@/entrypoints/background/events/messages/apiRequest';
import { handleOperateTabStorage } from '@/entrypoints/background/events/messages/operateStorage';
import { handleRegisterEvent } from '@/entrypoints/background/events/messages/registerEvent';
import { BackgroundMessage } from '@refly/common-types';
import { saveLastActiveTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';
import { Runtime } from 'wxt/browser';
import { handleOtherMessage } from './others';
import { handleInjectContentSelectorCss } from '@/entrypoints/background/events/messages/injectContentSelectorCss';

export const onMessage = async (
  msg: BackgroundMessage,
  sender: Runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => {
  // 前置做保存，后续使用
  await saveLastActiveTab();

  // 处理服务端来的发请求的操作
  if (msg.type === 'apiRequest') {
    return await handleRequestReflect({
      ...msg,
    });
  }

  if (msg.type === 'registerEvent') {
    return await handleRegisterEvent(msg);
  }

  if (msg.type === 'operateTabStorage') {
    return await handleOperateTabStorage(msg);
  }

  if (msg.type === 'others') {
    return await handleOtherMessage(msg);
  }

  if (msg.type === 'injectContentSelectorCss') {
    return await handleInjectContentSelectorCss(msg);
  }
};
