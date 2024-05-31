import React, { type Dispatch, useEffect, useRef, useState } from 'react';
import { reflyEnv } from '@/utils/env';
import hotKeys from 'hotkeys-js';
import { useBuildTask } from './use-build-task';
import { useChatStore } from '@/stores/chat';
import { LANGUAGE, LOCALE, TASK_TYPE, type Source, type Task } from '@/types';
import { buildChatTask } from '@/utils/task';
import { useWeblinkStore } from '@/stores/weblink';
import { useUserStore } from '@/stores/user';
import { apiRequest } from '@/requests/apiRequest';

export const useBindCommands = () => {
  // 快捷键相关
  const softKeyboardShortcutsEnabledRef = useRef(true);
  const keyboardShortcutRef = useRef('');
  const keyboardSendShortcutRef = useRef('');
  const { buildTaskAndGenReponse } = useBuildTask();

  const loadCommands = async () => {
    const commands = await apiRequest({
      name: 'getAllCommands',
    });
    commands?.data?.forEach((command) => {
      if (command?.name === '_execute_action' && command?.shortcut) {
        keyboardShortcutRef.current = command?.shortcut;
      }
    });

    const osType = reflyEnv.getOsType();
    if (!keyboardShortcutRef.current && softKeyboardShortcutsEnabledRef.current) {
      const defaultShortcutKey = reflyEnv.getDefaultShortcutKey();
      keyboardShortcutRef.current = osType === 'OSX' ? `Command+${defaultShortcutKey}` : `Ctrl+${defaultShortcutKey}`;
    }

    if (!keyboardSendShortcutRef.current) {
      const defaultSendShortcutKey = reflyEnv.getDefaultSendShortcutKey();
      keyboardSendShortcutRef.current =
        osType === 'OSX' ? `Command+${defaultSendShortcutKey}` : `Ctrl+${defaultSendShortcutKey}`;
    }

    handleBindHotkey();
  };
  const handleBindHotkey = () => {
    hotKeys(keyboardShortcutRef.current, { capture: true }, (e) => {
      e.preventDefault();
      e.stopPropagation();
      // setIsShowSide((prevState) => !prevState)
    });

    const elem = document.querySelector('#refly-main-app')?.shadowRoot?.querySelector('.message-input');
    hotKeys(
      keyboardSendShortcutRef.current,
      {
        capture: true,
        element: elem as HTMLElement,
      },
      (e) => {
        console.log('command');
        e.preventDefault();
        e.stopPropagation();

        const { newQAText } = useChatStore.getState();
        const { selectedRow } = useWeblinkStore.getState();
        const { localSettings } = useUserStore.getState();

        const selectedWebLink: Source[] = selectedRow?.map((item) => ({
          pageContent: '',
          metadata: {
            title: item?.content?.originPageTitle,
            source: item?.content?.originPageUrl,
          },
          score: -1, // 手工构造
        }));

        const task = buildChatTask(
          {
            question: newQAText,
            filter: { weblinkList: selectedWebLink },
          },
          localSettings.outputLocale,
        );

        buildTaskAndGenReponse(task);
      },
    );
  };

  useEffect(() => {
    loadCommands();

    return () => {};
  }, []);
};
