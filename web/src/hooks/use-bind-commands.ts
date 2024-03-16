import { useEffect, useRef } from "react"
import { reflyEnv } from "@/utils/env"
import hotKeys from "hotkeys-js"
import { useBuildTask } from "./use-build-task"
import { useChatStore } from "@/stores/chat"
import { type Source } from "@/types"
import { buildChatTask } from "@/utils/task"
import { useWeblinkStore } from "@/stores/weblink"
import getAllCommands from "@/requests/getAllCommands"

export const useBindCommands = () => {
  // 快捷键相关
  const softKeyboardShortcutsEnabledRef = useRef(true)
  const keyboardShortcutRef = useRef("")
  const keyboardSendShortcutRef = useRef("")
  const { buildTaskAndGenReponse } = useBuildTask()

  const loadCommands = async () => {
    const commands = await getAllCommands({
      body: null,
    })
    commands?.data?.forEach((command: any) => {
      if (command.name === "_execute_action" && command.shortcut) {
        keyboardShortcutRef.current = command.shortcut
      }
    })

    const osType = reflyEnv.getOsType()
    if (
      !keyboardShortcutRef.current &&
      softKeyboardShortcutsEnabledRef.current
    ) {
      const defaultShortcutKey = reflyEnv.getDefaultShortcutKey()
      keyboardShortcutRef.current =
        osType === "OSX"
          ? `Command+${defaultShortcutKey}`
          : `Ctrl+${defaultShortcutKey}`
    }

    if (!keyboardSendShortcutRef.current) {
      const defaultSendShortcutKey = reflyEnv.getDefaultSendShortcutKey()
      keyboardSendShortcutRef.current =
        osType === "OSX"
          ? `Command+${defaultSendShortcutKey}`
          : `Ctrl+${defaultSendShortcutKey}`
    }

    handleBindHotkey()
  }
  const handleBindHotkey = () => {
    hotKeys(keyboardShortcutRef.current, { capture: true }, e => {
      e.preventDefault()
      e.stopPropagation()
      // setIsShowSide((prevState) => !prevState)
    })

    hotKeys(
      keyboardSendShortcutRef.current,
      {
        capture: true,
        element: document.querySelector(".message-input") as HTMLElement,
      },
      e => {
        e.preventDefault()
        e.stopPropagation()

        const { newQAText } = useChatStore.getState()
        const { selectedRow } = useWeblinkStore.getState()

        const selectedWebLink: Source[] = selectedRow?.map(item => ({
          pageContent: "",
          metadata: {
            title: item?.content?.originPageTitle || "",
            source: item?.content?.originPageUrl || "",
          },
          score: -1, // 手工构造
        }))

        const task = buildChatTask({
          question: newQAText,
          filter: { weblinkList: selectedWebLink },
        })

        buildTaskAndGenReponse(task)
      },
    )
  }

  useEffect(() => {
    loadCommands()

    return () => {}
  }, [])
}
