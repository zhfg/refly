import React, { type Dispatch, useEffect, useRef, useState } from 'react';
import { reflyEnv } from '@/utils/env';
import hotKeys from 'hotkeys-js';
import { useBuildTask } from '@refly-packages/ai-workspace-common/hooks/use-build-task';
import { useChatStore } from '@/stores/chat';
import { Source } from '@refly/openapi-schema';
import { useWeblinkStore } from '@/stores/weblink';
import { useUserStore } from '@/stores/user';
import { apiRequest } from '@/requests/apiRequest';
import { useCopilotStore } from '@/modules/toggle-copilot/stores/copilot';

export const useBindCommands = () => {
  // 快捷键相关
  const copilotStore = useCopilotStore();
  const softKeyboardShortcutsEnabledRef = useRef(true);
  const keyboardShortcutRef = useRef('');
  const keyboardSendShortcutRef = useRef('');
  const { buildTaskAndGenReponse } = useBuildTask();

  // const loadCommands = async () => {
  //   const commands = await apiRequest({
  //     name: 'getAllCommands',
  //   });
  //   commands?.data?.forEach((command) => {
  //     if (command?.name === '_execute_action' && command?.shortcut) {
  //       keyboardShortcutRef.current = command?.shortcut;
  //     }
  //   });

  //   const osType = reflyEnv.getOsType();
  //   if (!keyboardShortcutRef.current && softKeyboardShortcutsEnabledRef.current) {
  //     const defaultShortcutKey = reflyEnv.getDefaultShortcutKey();
  //     keyboardShortcutRef.current = osType === 'OSX' ? `Command+${defaultShortcutKey}` : `Ctrl+${defaultShortcutKey}`;
  //   }

  //   if (!keyboardSendShortcutRef.current) {
  //     const defaultSendShortcutKey = reflyEnv.getDefaultSendShortcutKey();
  //     keyboardSendShortcutRef.current =
  //       osType === 'OSX' ? `Command+${defaultSendShortcutKey}` : `Ctrl+${defaultSendShortcutKey}`;
  //   }

  //   handleBindHotkey();
  // };

  const handleBindHotkey = () => {
    hotKeys('command+j, ctrl+j', () => {
      console.log('hit hotkey');

      const { isCopilotOpen } = useCopilotStore.getState();
      copilotStore.setIsCopilotOpen(!isCopilotOpen);
    });
  };

  useEffect(() => {
    handleBindHotkey();

    return () => {};
  }, []);
};
