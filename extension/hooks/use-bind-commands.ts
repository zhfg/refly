import { sendToBackground } from "@plasmohq/messaging"
import React, { type Dispatch, useEffect, useRef, useState } from "react"
import { reflyEnv } from "~utils/env"
import hotKeys from "hotkeys-js"
import { useSiderSendMessage } from '~hooks/use-sider-send-message'

export const useBindCommands = () => {
    // 快捷键相关
  const softKeyboardShortcutsEnabledRef = useRef(true)
  const keyboardShortcutRef = useRef("")
  const keyboardSendShortcutRef = useRef("")
  const { handleSideSendMessage } = useSiderSendMessage();

    const loadCommands = async () => {

        const commands = await sendToBackground({
          name: "getAllCommands"
        })
        commands.forEach((command) => {
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
        hotKeys(keyboardShortcutRef.current, { capture: true }, (e) => {
          e.preventDefault()
          e.stopPropagation()
          // setIsShowSide((prevState) => !prevState)
        })
    
        hotKeys(
          keyboardSendShortcutRef.current,
          {
            capture: true,
            element: document.querySelector(".message-input") as HTMLElement
          },
          (e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSideSendMessage()
          }
        )
      }


      useEffect(() => {
        loadCommands()
    
        return () => {}
      }, [])
}
