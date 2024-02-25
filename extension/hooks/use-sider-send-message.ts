import React, { type Dispatch, useEffect, useRef, useState } from "react"
import { useChatStore } from '~stores/chat'
import { useQuickActionStore } from '~stores/quick-action'
import { useBuildTask } from '~hooks/use-build-task'
import { scrollToBottom } from "~utils/ui"

export const useSiderSendMessage = () => {
    const chatStore = useChatStore();
    const quickActionStore = useQuickActionStore();
    const { buildIntentChatTaskAndGenReponse, buildChatTaskAndGenReponse } = useBuildTask();


    // 快捷键相关
    const handleSideSendMessage = (incomingQuestin?: string) => {
        if (chatStore.newQAText || incomingQuestin) {
          const question = incomingQuestin || chatStore.newQAText
    
          if (quickActionStore.selectedText) {
            buildIntentChatTaskAndGenReponse()
          } else {
            buildChatTaskAndGenReponse(question)
          }
    
          // 每发送一条消息后就将 messages 滚动到底部，以便于始终展示最新消息
          scrollToBottom()
    
          // 每发送一条消息后清空当前的输入框内容
          chatStore.setNewQAText('')
        }
      }

      return {
        handleSideSendMessage
      }
}
