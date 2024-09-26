import { useRef } from 'react';
import { useContentSelectorStore } from '../stores/content-selector';
import {
  onMessage,
  sendMessage, // Added this import
} from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import type { SyncMarkEvent, SyncStatusEvent } from '@refly/common-types';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

// stores

// 与 selectedText 一起控制最终的选中
export const useSelectedMark = () => {
  const contentSelectorStore = useContentSelectorStore();
  const contextPanelStore = useContextPanelStore((state) => ({
    currentSelectedMark: state.currentSelectedMark,
    currentSelectedMarks: state.currentSelectedMarks,
    updateCurrentSelectedMarks: state.updateCurrentSelectedMarks,
    updateCurrentSelectedMark: state.updateCurrentSelectedMark,
  }));
  const { setMarks, resetState } = useContentSelectorStore();
  const messageListenerEventRef = useRef<any>();

  // 从 content-selector-app 获取信息，以此和 main-app 解耦合
  const contentSelectedHandler = (event: MessageEvent<any>) => {
    const data = event as any as SyncMarkEvent;
    const { body, name } = data || {};

    if (name === 'syncMarkEvent') {
      console.log('contentSelectedHandler', data);
      // 代表从 content-selector-app 获取信息
      const { marks = [] } = useContentSelectorStore.getState();
      const { currentSelectedMarks, enableMultiSelect, currentSelectedMark } = useContextPanelStore.getState();
      const { type, mark } = body || {};

      // enableMultiSelect 只是打开生效状态，不影响实际选中
      if (type === 'remove') {
        const newMarks = marks.filter((item) => item?.xPath !== mark?.xPath);
        contentSelectorStore.setMarks(newMarks);

        const newCurrentSelectedMarks = currentSelectedMarks.filter((item) => item?.xPath !== mark?.xPath);
        contextPanelStore.updateCurrentSelectedMarks(newCurrentSelectedMarks);

        contextPanelStore.updateCurrentSelectedMark(null);
      } else if (type === 'add') {
        const newMarks = [...marks, mark];
        contentSelectorStore.setMarks(newMarks);

        const newCurrentSelectedMarks = [...currentSelectedMarks, mark];
        contextPanelStore.updateCurrentSelectedMarks(newCurrentSelectedMarks);

        contextPanelStore.updateCurrentSelectedMark(mark);
      } else if (type === 'reset') {
        // 这里代表一起清空
        contentSelectorStore.setMarks([]);
        contextPanelStore.updateCurrentSelectedMarks([]);
        contextPanelStore.updateCurrentSelectedMark(null);
      }
    }
  };

  const handleInitContentSelectorListener = () => {
    const { isInjectStyles, scope } = useContentSelectorStore.getState();
    contentSelectorStore.setShowContentSelector(true);
    const runtime = getRuntime();

    // if (runtime !== 'web') {
    //   // TODO: 这里需要持有持久状态，不能光靠前端临时状态保持，因为 sidepanel 会被关闭
    //   sendMessage({
    //     type: 'injectContentSelectorCss',
    //     name: 'injectContentSelectorCss',
    //     source: runtime,
    //   });

    //   contentSelectorStore?.setIsInjectStyles(true);
    // }

    const event: SyncStatusEvent = {
      name: 'syncMarkStatusEvent',
      body: {
        type: 'start',
        scope,
      },
    };

    sendMessage({
      ...event,
      source: runtime,
    });
  };

  const handleStopContentSelectorListener = () => {
    const { scope } = useContentSelectorStore.getState();
    contentSelectorStore.setShowContentSelector(false);

    const event: SyncStatusEvent = {
      name: 'syncMarkStatusEvent',
      body: {
        type: 'stop',
        scope,
      },
    };
    sendMessage({
      ...event,
      source: getRuntime(),
    });
  };

  const handleRemoveMark = (xPath: string) => {
    const { marks } = useContentSelectorStore.getState();
    const mark = marks.find((item) => item?.xPath === xPath);
    const event: SyncMarkEvent = { body: { type: 'remove', mark }, name: 'syncMarkEventBack' };
    sendMessage({
      ...event,
      source: getRuntime(),
    });

    const newMarks = marks.filter((item) => item?.xPath !== xPath);
    setMarks(newMarks);
  };

  const handleRemoveAllMarks = () => {
    const event: SyncMarkEvent = { body: { type: 'reset' }, name: 'syncMarkEventBack' };
    setMarks([]);
    sendMessage({
      ...event,
      source: getRuntime(),
    });
  };

  const handleReset = () => {
    const { scope } = useContentSelectorStore.getState();
    contentSelectorStore.setShowContentSelector(false);

    const event: SyncStatusEvent = {
      name: 'syncMarkStatusEvent',
      body: {
        type: 'reset',
        scope,
      },
    };
    sendMessage({
      ...event,
      source: getRuntime(),
    });

    handleRemoveAllMarks();
    resetState();
  };

  const initMessageListener = () => {
    onMessage(contentSelectedHandler, getRuntime()).then((clearEvent) => {
      messageListenerEventRef.current = clearEvent;
    });

    return () => {
      messageListenerEventRef.current?.(); // clear event
    };
  };

  return {
    handleInitContentSelectorListener,
    handleStopContentSelectorListener,
    handleReset,
    handleRemoveAllMarks,
    handleRemoveMark,
    initMessageListener,
  };
};
