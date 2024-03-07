import React, { useRef, useCallback } from "react"
import { useChatStore } from "../stores/chat"
import { useMessageStateStore } from "../stores/message-state"
import { useConversationStore } from "../stores/conversation"
import type { Message, MessageState } from "@/types"
import { MessageItemType, TASK_STATUS, TASK_TYPE } from "@/types"
import type { QUICK_ACTION, Task } from "@/types"
import { buildTask } from "@/utils/task"
import { buildQuestionMessage, buildReplyMessage } from "@/utils/message"

import { getPort, removePort } from "@plasmohq/messaging/port"
import { buildErrorMessage } from "@/utils/message"
import { scrollToBottom } from "@/utils/ui"
import { safeParseJSON } from "@/utils/parse"

export const useBuildTask = () => {
  const genResponsePortRef = useRef<chrome.runtime.Port>()

  const chatStore = useChatStore()
  const messageStateStore = useMessageStateStore()
  const conversationStore = useConversationStore()

  const hasConversation = (id: string) => {
    return (
      conversationStore.conversationList.filter(
        item => item.conversationId === id,
      )?.length > 0
    )
  }

  const buildGenTitleTaskAndGenResponse = () => {
    // 每次生成会话 title 时，需要重置此字段
    chatStore.setIsGenTitle(false)

    // 生成 chat task
    const taskPayload = {
      taskType: TASK_TYPE.GEN_TITLE,
      data: {
        conversationId: conversationStore.currentConversation?.conversationId,
      },
    }
    const task = buildTask(taskPayload)
    // handleGenResponse(task)
  }

  const buildQuickActionTaskAndGenReponse = (
    taskType: TASK_TYPE,
    data: QUICK_ACTION,
  ) => {
    const task = buildTask({ taskType, data })

    handleGenResponse(task)
  }

  const buildChatTaskAndGenReponse = (question: string) => {
    const questionMsg = buildQuestionMessage({
      conversationId: conversationStore.currentConversation?.conversationId,
      content: question,
    })

    const replyMsg = buildReplyMessage({
      conversationId: conversationStore.currentConversation?.conversationId,
      content: "",
      questionId: questionMsg?.itemId,
    })

    // 将 reply 加到 message-state
    messageStateStore.setMessageState({
      pendingReplyMsg: replyMsg,
    })

    chatStore.setMessages(chatStore.messages.concat(questionMsg))

    // 将最后一条回答拼到上下文中
    const lastReplyMsg = chatStore.messages
      .filter(message => message?.itemType === MessageItemType?.REPLY)
      ?.at(-1)
    const taskMsgList = lastReplyMsg
      ? [lastReplyMsg, questionMsg]
      : [questionMsg]

    // 生成 chat task
    const taskPayload = {
      taskType: TASK_TYPE.CHAT,
      data: {
        ...conversationStore.currentConversation,
        items: taskMsgList,
        preGeneratedReplyId: replyMsg?.itemId, // 预先生成的回复，用于快速问答 message
      },
    }
    const task = buildTask(taskPayload)
    handleGenResponse(task)
  }

  const buildShutdownTaskAndGenResponse = () => {
    handleSendMessageWithPorts({
      body: {
        type: TASK_STATUS.SHUTDOWN,
      },
    })
  }

  const handleGenResponse = useCallback(
    (task: Task) => {
      // 发起一个 gen 请求，开始接收
      messageStateStore.setMessageState({
        pending: true,
        pendingFirstToken: true,
        taskType: task?.taskType,
        pendingMsg: "",
        error: false,
      })

      // 直接发送 task
      handleSendMessageWithPorts({
        body: {
          type: TASK_STATUS.START,
          payload: task,
        },
      })
    },
    [conversationStore.currentConversation?.conversationId],
  )

  const handleStreamingMessage = (msg: { message: string }) => {
    console.log("onMessage", msg)
    const currentMessageState = useMessageStateStore.getState()
    const currentChatState = useChatStore.getState()
    // 新生成一个会话，并且已经有了第一次提问和回答，说明此会话已经保存到数据库，此时可以将会话加入到会话列表里
    // if (!chatStore.isGenTitle) {

    //     !hasConversation(conversationStore.currentConversation?.conversationId) &&
    //         conversationStore.updateConversation(
    //             ConversationOperation.CREATE,
    //             conversationStore.currentConversation
    //         )
    // }

    const comingMsgPayload = safeParseJSON(msg?.message)
    console.log("setMessageState", comingMsgPayload)

    if (msg?.message === `[DONE]`) {
      const newMessageState: Partial<MessageState> = {
        pending: false,
        error: false,
      }

      // 如果一条消息也没收到就 abort 或者其他形式的 DONE，那么代表响应出错
      if (
        [TASK_TYPE.CHAT, TASK_TYPE.QUICK_ACTION].includes(
          currentMessageState?.taskType as TASK_TYPE,
        ) &&
        currentMessageState.pendingMsg?.length === 0
      ) {
        if (currentMessageState.taskType === TASK_TYPE.CHAT) {
          // 构建一条错误消息放在末尾，而不是类似 loading 直接展示，因为要 error 停留在聊天列表里
          const errMsg = buildErrorMessage({
            conversationId:
              conversationStore.currentConversation?.conversationId,
          })

          chatStore.setMessages([...currentChatState.messages, { ...errMsg }])

          // 更新消息之后滚动到底部
          setTimeout(() => {
            scrollToBottom()
          }, 1000)

          newMessageState.error = true
          newMessageState.pendingFirstToken = false
        } else if (currentMessageState.taskType === TASK_TYPE.QUICK_ACTION) {
          // 针对 quickAction 这类一次性的，就是直接展示错误信息
          newMessageState.error = true
          newMessageState.pendingFirstToken = false
        }

        // 更新 messageState 的状态，然后直接结束，不走后面的流程
        messageStateStore.setMessageState(newMessageState)

        return
      }

      // 更新 messageState 的状态
      messageStateStore.setMessageState(newMessageState)

      // 如果出错，就不会进行 gen-title 的操作
      if (
        currentMessageState.taskType === TASK_TYPE.CHAT &&
        !chatStore.isGenTitle
      ) {
        // 会话第一次发消息，会再额外多发一个消息用于生产会话 title
        buildGenTitleTaskAndGenResponse()
        chatStore.setIsGenTitle(true)
      }

      // 如果此次任务是 gen_title 的任务，那么就去更新对应的会话列表里面的会话 title，默认为 New Conversation/新会话
      // TODO: 可以改成流式，到时候看实际反馈
      if (currentMessageState.taskType === TASK_TYPE.GEN_TITLE) {
        // TODO: 先不处理更新 title 等边缘的操作
        // handleConversationOperation(ConversationOperation.UPDATE, {
        //   conversationId: nowConversationRef.current?.conversationId,
        //   title: messageStateRef?.current?.pendingMsg
        // })
      }

      return
    }

    // 流式更新消息
    if (comingMsgPayload?.type !== "source") {
      messageStateStore.setMessageState({
        pendingMsg:
          (currentMessageState?.pendingMsg || "") + comingMsgPayload?.body,
      })
    }

    // 只有在聊天场景下，才需要更新最后一条消息
    if (currentMessageState.taskType === TASK_TYPE.CHAT) {
      if (currentMessageState.pendingFirstToken) {
        const lastMessage = currentMessageState.pendingReplyMsg as Message

        lastMessage.data.content =
          lastMessage?.data?.content + comingMsgPayload?.type === "source"
            ? ""
            : comingMsgPayload?.body

        if (comingMsgPayload?.type === "source") {
          const sourceWeblinkPayload = comingMsgPayload?.body
          console.log("sourceWeblinkPayload", sourceWeblinkPayload)
          messageStateStore.setMessageState({
            ...currentMessageState,
            pendingSourceDocs: (
              currentMessageState.pendingSourceDocs || []
            ).concat(sourceWeblinkPayload),
          })

          console.log("sourceWeblinkPayload", lastMessage.data.sources)

          if (Array.isArray(lastMessage?.data?.sources)) {
            lastMessage.data.sources = lastMessage?.data?.sources?.concat(
              sourceWeblinkPayload || [],
            )
          } else {
            lastMessage.data.sources = [sourceWeblinkPayload]
          }

          // 更新消息之后滚动到底部
          setTimeout(() => {
            scrollToBottom()
          }, 1000)
        }

        chatStore.setMessages([
          ...currentChatState.messages,
          { ...lastMessage },
        ])

        // 更新消息之后滚动到底部
        setTimeout(() => {
          scrollToBottom()
        }, 1000)
      } else {
        // 代表是 source docs，就更新 source docs 信息
        if (comingMsgPayload?.type === "source") {
          const sourceWeblinkPayload = comingMsgPayload?.body
          console.log("sourceWeblinkPayload", sourceWeblinkPayload)
          messageStateStore.setMessageState({
            ...currentMessageState,
            pendingSourceDocs: (
              currentMessageState.pendingSourceDocs || []
            ).concat(sourceWeblinkPayload),
          })

          const lastMessage = currentChatState.messages.at(-1) as Message
          const savedMessage = currentChatState.messages.slice(
            0,
            -1,
          ) as Message[]

          console.log("sourceWeblinkPayload", lastMessage?.data.sources)

          if (Array.isArray(lastMessage?.data?.sources)) {
            lastMessage.data.sources = lastMessage?.data?.sources?.concat(
              sourceWeblinkPayload || [],
            )
          } else {
            lastMessage.data.sources = [sourceWeblinkPayload]
          }
          chatStore.setMessages([...savedMessage, { ...lastMessage }])
        } else {
          const lastMessage = currentChatState.messages.at(-1) as Message
          const savedMessage = currentChatState.messages.slice(
            0,
            -1,
          ) as Message[]

          lastMessage.data.content =
            lastMessage?.data?.content + comingMsgPayload?.body
          chatStore.setMessages([...savedMessage, { ...lastMessage }])
        }
      }
    }

    // 已经收到消息，将 pendingFirstToken 设置为 false
    if (currentMessageState.pendingFirstToken) {
      messageStateStore.setMessageState({ pendingFirstToken: false })
    }
  }

  const bindExtensionPorts = () => {
    console.log("bindExtensionPorts")
    if (genResponsePortRef.current) return
    console.log("alreadybindExtensionPorts")

    genResponsePortRef.current = getPort("gen-response" as never)
    genResponsePortRef.current.onMessage.addListener(handleStreamingMessage)
  }

  const unbindExtensionPorts = () => {
    console.log("unbindExtensionPorts")
    if (genResponsePortRef?.current) return

    genResponsePortRef.current?.onMessage?.removeListener?.(
      handleStreamingMessage,
    )
    removePort?.("gen-response" as never)
  }

  const handleSendMessageWithPorts = payload => {
    // 先 unbind
    unbindExtensionPorts()
    // 再 bind
    bindExtensionPorts()

    // 生成任务
    genResponsePortRef.current.postMessage(payload)
  }

  return {
    buildQuickActionTaskAndGenReponse,
    buildGenTitleTaskAndGenResponse,
    buildChatTaskAndGenReponse,
    buildShutdownTaskAndGenResponse,
  }
}
