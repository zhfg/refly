import { useEffect } from 'react';
// import { reflyEnv } from "@refly-packages/ai-workspace-common/utils/env"
import hotKeys from 'hotkeys-js';
// import { useBuildTask } from "./use-build-task"
import { useQuickSearchStateStore } from '@refly-packages/ai-workspace-common/stores/quick-search-state';
import { useIsLogin } from './use-is-login';
// import { useChatStore } from "@refly-packages/ai-workspace-common/stores/chat"
// import { type Source } from "@refly-packages/ai-workspace-common/types"
// import { buildChatTask } from "@refly-packages/ai-workspace-common/utils/task"
// import { useWeblinkStore } from "@refly-packages/ai-workspace-common/stores/weblink"
// import getAllCommands from "@refly-packages/ai-workspace-common/requests/getAllCommands"

export const useBindCommands = () => {
  // 快捷键相关
  // const softKeyboardShortcutsEnabledRef = useRef(true)
  // const keyboardShortcutRef = useRef("")
  // const keyboardSendShortcutRef = useRef("")
  // const { buildTaskAndGenReponse } = useBuildTask()
  const quickSearchStateStore = useQuickSearchStateStore();
  const { isLoggedRef } = useIsLogin();

  const loadCommands = async () => {
    // const commands = await getAllCommands({
    //   body: null,
    // })
    // commands?.data?.forEach((command: any) => {
    //   if (command.name === "_execute_action" && command.shortcut) {
    //     keyboardShortcutRef.current = command.shortcut
    //   }
    // })
    // const osType = reflyEnv.getOsType()
    // if (
    //   !keyboardShortcutRef.current &&
    //   softKeyboardShortcutsEnabledRef.current
    // ) {
    //   const defaultShortcutKey = reflyEnv.getDefaultShortcutKey()
    //   keyboardShortcutRef.current =
    //     osType === "OSX"
    //       ? `Command+${defaultShortcutKey}`
    //       : `Ctrl+${defaultShortcutKey}`
    // }
    // if (!keyboardSendShortcutRef.current) {
    //   const defaultSendShortcutKey = reflyEnv.getDefaultSendShortcutKey()
    //   keyboardSendShortcutRef.current =
    //     osType === "OSX"
    //       ? `Command+${defaultSendShortcutKey}`
    //       : `Ctrl+${defaultSendShortcutKey}`
    // }
  };
  const handleBindHotkey = () => {
    hotKeys('command+k, ctrl+k', () => {
      console.log('hit hotkey');

      // 没有登录的时候不处理
      if (!isLoggedRef.current) {
        return;
      }

      quickSearchStateStore.setVisible(true);
    });
  };

  useEffect(() => {
    loadCommands();
    handleBindHotkey();

    return () => {};
  }, []);
};
