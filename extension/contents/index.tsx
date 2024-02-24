import { Button } from "@arco-design/web-react"
import ArcoCSS from "data-text:@arco-design/web-react/dist/css/arco.css"
import ChatCSSText from "data-text:~/components/chat/index.scss"
import ConversationListCSS from "data-text:~/components/conversation-list.scss"
import QuickActionCSS from "data-text:~/components/quick-action.scss"
import LocalArcoCSS from "data-text:~/contents/arco.css"
import CSSText from "data-text:~/contents/index.scss"
import HighlightCSSText from "data-text:~/contents/styles/highlight.scss"
import MarkdownCSSText from "data-text:~/contents/styles/markdown.scss"
import hotKeys from "hotkeys-js"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// import { dark } from "react-syntax-highlighter/dist/esm/styles/prism"

import { useMessage } from "@plasmohq/messaging/hook"
import { getPort } from "@plasmohq/messaging/port"
import { useStorage } from "@plasmohq/storage/hook"

import {
  ACTION_TYPE,
  ConversationOperation,
  MessageItemType,
  ReplyType,
  TASK_STATUS,
  TASK_TYPE,
  type Conversation,
  type Message,
  type MessageState,
  type Mode,
  type QUICK_ACTION,
  type Task
} from "~/types"
import Logo from "~assets/logo.svg"
import ConversationList from "~components/conversation-list"
// 使用方法
import { useSwitchTheme } from "~hooks/use-switch-theme"
import { buildConversation } from "~utils/conversation"
import { reflyEnv } from "~utils/env"
import {
  buildErrorMessage,
  buildIntentMessage,
  buildIntentMessageList,
  buildQuestionMessage,
  buildQuestionMessageList,
  buildReplyMessage
} from "~utils/message"
import { buildTask } from "~utils/task"
import { calcPopupPosition, scrollToBottom } from "~utils/ui"

// 自定义组件
import Chat from "../components/chat"
import QuickAction, { modeList } from "../components/quick-action"

// export const config: PlasmoCSConfig = {
//   run_at: "document_end"
// }

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => document.body

// 自定义类型

// const CodeComponent = ({ node, inline, className, children, ...props }) => {
//   const match = /language-(\w+)/.exec(className || "")
//   return !inline && match ? (
//     <SyntaxHighlighter
//       {...props}
//       children={String(children).replace(/\n$/, "")}
//       style={dark}
//       language={match[1]}
//       PreTag="div"
//     />
//   ) : (
//     <code {...props} className={className}>
//       {children}
//     </code>
//   )
// }

const defaultMessageState = {
  pendingMsg: "", // 生成中的 msg
  pendingFirstToken: false, // 是否正在准备生成，如果收到第一个字符，即代表已经开始生生成
  pending: false, // 是否正在生成，表示一次任务生成是否正在进行中
  error: false, // 此次信息是否出错，比如还没开始生成就 abort，显示错误信息
  pendingReplyMsg: null, // 即将生成的 replyMsg 对象
  taskType: TASK_TYPE.CHAT,
  history: [], // 本次聊天历史
  pendingSourceDocs: [] // 实现搜索知识库时，给出的答案引用来源
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent =
    LocalArcoCSS +
    ArcoCSS +
    CSSText +
    ConversationListCSS +
    ChatCSSText +
    QuickActionCSS +
    MarkdownCSSText +
    HighlightCSSText
  return style
}

export const Content = () => {
  const barWidth = 145
  const barHeight = 33

  const [barPosition, setBarPosition] = useState<{
    top?: number
    left?: number
  }>()

  // 打开聊天窗口的方式

  const [isShowSide, setIsShowSide] = useState(false)
  const [newQAText, setNewQAText] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [popupVisible, setPopupVisible] = useState(false)
  const [quickActionToolbarVisible, setQuickActionToolbarVisible] =
    useState(false)

  const [defaultMode, setDefaultMode] = useStorage<Mode>(
    "defaultMode",
    modeList[0]
  )
  const [currentMode, setCurrentMode] = useState<Mode>(defaultMode)
  const conversationListInstanceRef = useRef(null)

  const newQATextRef = useRef("")
  const selectedTextRef = useRef("")
  const defaultModeRef = useRef<Mode>()
  const currentModeRef = useRef<Mode>()
  const messageStateRef = useRef<MessageState>()
  const messagesRef = useRef<Message[]>()
  const isGenTitleRef = useRef<boolean>(false)
  const nowConversationRef = useRef<Conversation>()

  // 快捷键相关
  const softKeyboardShortcutsEnabledRef = useRef(true)
  const keyboardShortcutRef = useRef("")
  const keyboardSendShortcutRef = useRef("")

  /**
   * 以下几种情况会新建会话 Id：
   * 1. 打开一个新的 quickAction
   * 2. 开启聊天窗口（侧边栏、浮框、或者 Options 页）
   *
   * 页面状态和会话 Id 是绑定的：
   * - messages
   * - messageState
   * - selectedText
   * - popupVisible
   * - newQAText
   * - currentMode
   */
  // 初始化会话
  const [nowConversation, setNowConversation] =
    useState<Conversation>(buildConversation())

  // 初始化 Welcome message
  const [messages, setMessages] = useState<Message[]>([])
  const [messageState, setMessageState] =
    useState<MessageState>(defaultMessageState)

  const genResponsePortRef = useRef<chrome.runtime.Port>()

  const extensionMessage = useMessage<
    { name: string; toggle: boolean },
    string
  >((req, res) => {
    res.send(isShowSide ? "true" : "false")
  })

  const handleChangeDefaultMode = (mode: Mode) => {
    setDefaultMode(mode)
  }

  const handleShutdownGenReponseTask = () => {
    genResponsePortRef.current.postMessage({
      body: {
        type: TASK_STATUS.SHUTDOWN
      }
    })
  }
  const handleGenResponse = useCallback(
    (task: Task) => {
      // 发起一个 gen 请求，开始接收
      messageStateRef.current = {
        ...messageStateRef.current,
        pending: true,
        pendingFirstToken: true,
        taskType: task.taskType,
        pendingMsg: "",
        error: false
      }
      setMessageState((state) => ({
        ...state,
        pending: true,
        pendingFirstToken: true,
        taskType: task?.taskType,
        pendingMsg: "",
        error: false
      }))

      // 直接发送 task
      genResponsePortRef.current.postMessage({
        body: {
          type: TASK_STATUS.START,
          payload: task
        }
      })
    },
    [nowConversation?.conversationId]
  )
  const handleQuickActionGenResponse = (
    taskType: TASK_TYPE,
    data: QUICK_ACTION
  ) => {
    let postProcessedData = data
    if (data?.actionPrompt === modeList[3].prompt) {
      postProcessedData.actionPrompt = postProcessedData.actionPrompt.replace(
        "$[text]",
        data.reference
      )
      postProcessedData.reference = ""
    }
    buildQuickActionTaskAndGenReponse(taskType, postProcessedData)
  }

  const handleMenuItemClick = useCallback(
    (mode: Mode) => {
      setCurrentMode(mode)
      setPopupVisible(true)

      // handleGenResponse(QuestionType.QuickAction, selectedTextRef.current, mode)
      handleQuickActionGenResponse(TASK_TYPE.QUICK_ACTION, {
        actionType: ACTION_TYPE.SELECTION,
        actionPrompt: mode?.prompt,
        reference: selectedTextRef.current
      })
    },
    [selectedText]
  )

  const handleBarFuncClick = (mode: Mode) => {
    setPopupVisible(() => true)
    setCurrentMode(() => mode)

    // handleGenResponse(QuestionType.QuickAction, selectedTextRef.current, mode)
    handleQuickActionGenResponse(TASK_TYPE.QUICK_ACTION, {
      actionType: ACTION_TYPE.SELECTION,
      actionPrompt: mode?.prompt,
      reference: selectedTextRef.current
    })
  }

  const handleInputChange = (value: string) => {
    setSelectedText(() => value)
  }

  const handleSideInputChange = (value: string) => {
    setNewQAText(() => value)
  }

  const buildQuickActionTaskAndGenReponse = (
    taskType: TASK_TYPE,
    data: QUICK_ACTION
  ) => {
    const task = buildTask({ taskType, data })

    handleGenResponse(task)
  }
  const buildGenTitleTaskAndGenResponse = () => {
    // 每次生成会话 title 时，需要重置此字段
    isGenTitleRef.current = false

    // 生成 chat task
    const taskPayload = {
      taskType: TASK_TYPE.GEN_TITLE,
      data: {
        conversationId: nowConversationRef.current.conversationId
      }
    }
    const task = buildTask(taskPayload)
    // handleGenResponse(task)
  }
  const buildChatTaskAndGenReponse = (question: string) => {
    const questionMsg = buildQuestionMessage({
      conversationId: nowConversation.conversationId,
      content: question
    })

    const replyMsg = buildReplyMessage({
      conversationId: nowConversation.conversationId,
      content: "",
      questionId: questionMsg?.itemId
    })

    // 将 reply 加到 message-state
    setMessageState((state) => ({ ...state, pendingReplyMsg: replyMsg }))
    messageStateRef.current = {
      ...messageStateRef.current,
      pendingReplyMsg: replyMsg
    }

    setMessages((oldMessage) => oldMessage.concat(questionMsg))

    // 将最后一条回答拼到上下文中
    const lastReplyMsg = messagesRef.current
      .filter((message) => message?.itemType === MessageItemType?.REPLY)
      ?.at(-1)
    const taskMsgList = lastReplyMsg
      ? [lastReplyMsg, questionMsg]
      : [questionMsg]

    // 生成 chat task
    const taskPayload = {
      taskType: TASK_TYPE.CHAT,
      data: {
        ...nowConversation,
        items: taskMsgList,
        preGeneratedReplyId: replyMsg?.itemId // 预先生成的回复，用于快速问答 message
      }
    }
    const task = buildTask(taskPayload)
    handleGenResponse(task)
  }

  const buildIntentTaskAndGenReponse = (questionContent: string) => {
    const oldMessages = messagesRef.current
    const conversationId = nowConversationRef.current?.conversationId
    const selectionContent = selectedTextRef.current
    const replyContent = ""

    const lastOldReplyMsg = oldMessages
      .filter((item) => item.itemType === MessageItemType.REPLY)
      ?.at(-1)
    const intentMsgList = buildIntentMessageList({
      conversationId,
      selectionContent,
      questionContent,
      replyContent
    })

    const replyMsg = intentMsgList.at(-1)
    // 将 reply 加到 message-state
    setMessageState((state) => ({ ...state, pendingReplyMsg: replyMsg }))
    messageStateRef.current = {
      ...messageStateRef.current,
      pendingReplyMsg: replyMsg
    }

    const newMsgList = oldMessages.concat(intentMsgList.slice(0, -1))
    setMessages(() => newMsgList)
    setSelectedText(() => "")

    const lastReplyMsgItemId = intentMsgList.at(-1)?.itemId

    // 生成 chat task
    const taskPayload = {
      taskType: TASK_TYPE.CHAT,
      data: {
        ...nowConversation,
        items: [lastOldReplyMsg, ...intentMsgList.slice(0, -1)], // 最后一条回复，加上生成的三条，不算新生成的回复
        preGeneratedReplyId: lastReplyMsgItemId // 预先生成的回复，用于快速问 答 message
      }
    }
    const task = buildTask(taskPayload)
    handleGenResponse(task)
  }
  const buildIntentChatTaskAndGenReponse = () => {
    buildIntentTaskAndGenReponse(newQATextRef.current)
  }
  const buildIntentQuickActionTaskAndGenReponse = (questionContent: string) => {
    buildIntentTaskAndGenReponse(questionContent)
  }

  /**
   * 操作路径：
   * 0. 有基础的欢迎语
   * 1. 已经选中一段文字，并携带意图的推荐提问
   * 2. 基于这段文字已经提问（快捷操作），并获得了回答
   * 3. 打开聊天框，
   */
  const continueChatFromQuickAction = async () => {
    // 隐藏快捷操作框
    setPopupVisible(() => false)
    setQuickActionToolbarVisible(() => false)
    setSelectedText(() => "")

    // TODO: /api/task/syncChatItems
    const oldMessages = messagesRef.current
    const conversationId = nowConversationRef.current?.conversationId
    const selectionContent = selectedTextRef.current
    const questionContent = currentModeRef.current.prompt
    const replyContent = messageStateRef.current.pendingMsg

    const intentMsgList = buildIntentMessageList({
      conversationId,
      selectionContent,
      questionContent,
      replyContent
    })

    const newMsgList = oldMessages.concat(intentMsgList)
    setMessages(() => newMsgList)

    // 保持右侧 sider 框常开
    setIsShowSide(() => {
      return true
    })

    // 进行消息同步
    const resp = await sendToBackground({
      name: "syncChatItems",
      body: { ...nowConversationRef.current, items: newMsgList }
    })

    // 为此会话生成 title
    buildGenTitleTaskAndGenResponse()
  }
  const handleSideSendMessage = (incomingQuestin?: string) => {
    if (newQATextRef.current || incomingQuestin) {
      const question = incomingQuestin || newQATextRef.current

      if (selectedTextRef.current) {
        buildIntentChatTaskAndGenReponse()
      } else {
        buildChatTaskAndGenReponse(question)
      }

      // 每发送一条消息后就将 messages 滚动到底部，以便于始终展示最新消息
      scrollToBottom()

      // 每发送一条消息后清空当前的输入框内容
      setNewQAText(() => "")
    }
  }

  /**
   * 1. 以下几种情况会新建会话 Id：
   *      1. 打开一个新的 quickAction
   *      2. 开启聊天窗口（侧边栏、浮框、或者 Options 页）
   * 2. 直到第一次调用 /generate/gen 接口生成响应的时候，才将会话 id 传给服务端保存一个会话
   */
  const handleCreateNewConversation = () => {
    const newConversation = buildConversation()
    setNowConversation(newConversation)
  }
  const handleConversationOperation = (
    operationType: ConversationOperation,
    payload: Partial<Conversation>
  ) => {
    switch (operationType) {
      case ConversationOperation.CREATE: {
        const {
          title = "新会话",
          conversationId,
          origin,
          originPageTitle
        } = payload
        const newConversation = {
          title: title ?? "新会话",
          conversationId,
          origin,
          originPageTitle,
          createdAt: new Date().getTime() as number,
          updatedAt: new Date().getTime() as number,
          readEnhanceArticle: null,
          readEnhanceIndexStatus: null
        } as Conversation

        const conversationList =
          conversationListInstanceRef.current?.getConversationList()
        conversationListInstanceRef.current?.setConversationList(
          [newConversation].concat(conversationList)
        )

        return
      }

      case ConversationOperation.DELETE: {
        const { conversationId } = payload
        const conversationList =
          conversationListInstanceRef.current?.getConversationList() || []
        const newConversationList = conversationList.filter(
          (item) => item.conversationId !== conversationId
        )
        conversationListInstanceRef.current?.setConversationList(
          newConversationList
        )

        return
      }

      case ConversationOperation.UPDATE: {
        const { conversationId } = payload
        const conversationList =
          conversationListInstanceRef.current?.getConversationList() || []
        const newConversationList = conversationList.map((item) => {
          if (item.conversationId === conversationId) {
            return { ...item, ...payload }
          }

          return item
        })

        conversationListInstanceRef.current?.setConversationList(
          newConversationList
        )

        return
      }
    }
  }

  const handleMouseUp = (event: MouseEvent) => {
    const { target } = event
    const nodeName = (target as any).nodeName

    if (nodeName === "PLASMO-CSUI") {
      // 点击的是 Bar 上的按钮，返回
      return
    }

    const selection = window.getSelection()
    const text = selection.toString()
    if (text) {
      const range = selection.getRangeAt(0)

      const rect = range?.getBoundingClientRect()
      const { top, left } = calcPopupPosition(rect, { barWidth, barHeight })

      setBarPosition({ top, left })
      setSelectedText(() => text)
      setQuickActionToolbarVisible(() => true)
    }
  }

  const handleMouseDown = (event: MouseEvent) => {
    const { target } = event
    const nodeName = (target as any).nodeName

    if (nodeName === "PLASMO-CSUI") {
      // 点击的是 Bar 上的按钮，返回
      return
    }

    const selection = window.getSelection()
    const text = selection.toString()
    // 手动清除当前选中的文本，解决了当鼠标按下区域为非文本区域时，Bar 不能及时隐藏
    if (
      text.length === 0 ||
      selectedText.length === 0 ||
      text === selectedText
    ) {
      window.getSelection().empty()
      setSelectedText(() => "")
      setQuickActionToolbarVisible(() => false)
      setPopupVisible(false)
    }
  }

  // 允许用户自定义快捷键
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

  const bindMouseEvent = () => {
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mousedown", handleMouseDown)
  }

  const bindExtensionPorts = () => {
    if (genResponsePortRef.current) return

    genResponsePortRef.current = getPort("gen-response" as never)
    genResponsePortRef.current.onMessage.addListener((msg) => {
      // 新生成一个会话，并且已经有了第一次提问和回答，说明此会话已经保存到数据库，此时可以将会话加入到会话列表里
      if (!isGenTitleRef?.current) {
        const hasConversation =
          conversationListInstanceRef.current?.hasConversation(
            nowConversationRef.current?.conversationId
          )

        !hasConversation &&
          handleConversationOperation(
            ConversationOperation.CREATE,
            nowConversationRef.current
          )
      }

      console.log("setMessageState", messageStateRef.current, messageState)

      if (msg?.message === "[DONE]") {
        const newMessageState: Partial<MessageState> = {
          pending: false,
          error: false
        }

        // 如果一条消息也没收到就 abort 或者其他形式的 DONE，那么代表响应出错
        if (
          [TASK_TYPE.CHAT, TASK_TYPE.QUICK_ACTION].includes(
            messageStateRef.current?.taskType
          ) &&
          messageStateRef.current?.pendingMsg?.length === 0
        ) {
          if (messageStateRef.current?.taskType === TASK_TYPE.CHAT) {
            // 构建一条错误消息放在末尾，而不是类似 loading 直接展示，因为要 error 停留在聊天列表里
            const errMsg = buildErrorMessage({
              conversationId: nowConversation.conversationId
            })

            setMessages((messages) => {
              scrollToBottom()
              const savedMessage = messages

              return [...savedMessage, { ...errMsg }]
            })

            newMessageState.error = true
            newMessageState.pendingFirstToken = false
          } else if (
            messageStateRef.current?.taskType === TASK_TYPE.QUICK_ACTION
          ) {
            // 针对 quickAction 这类一次性的，就是直接展示错误信息
            newMessageState.error = true
            newMessageState.pendingFirstToken = false
          }

          // 更新 messageState 的状态，然后直接结束，不走后面的流程
          setMessageState({ ...messageStateRef.current, ...newMessageState })
          messageStateRef.current = {
            ...messageStateRef.current,
            ...newMessageState
          }

          return
        }

        // 更新 messageState 的状态
        setMessageState({ ...messageStateRef.current, ...newMessageState })
        messageStateRef.current = {
          ...messageStateRef.current,
          ...newMessageState
        }

        // 如果出错，就不会进行 gen-title 的操作
        if (
          messageStateRef.current?.taskType === TASK_TYPE.CHAT &&
          !isGenTitleRef.current
        ) {
          // 会话第一次发消息，会再额外多发一个消息用于生产会话 title
          buildGenTitleTaskAndGenResponse()
          isGenTitleRef.current = true
        }

        // 如果此次任务是 gen_title 的任务，那么就去更新对应的会话列表里面的会话 title，默认为 New Conversation/新会话
        // TODO: 可以改成流式，到时候看实际反馈
        if (messageStateRef.current?.taskType === TASK_TYPE.GEN_TITLE) {
          // TODO: 先不处理更新 title 等边缘的操作
          // handleConversationOperation(ConversationOperation.UPDATE, {
          //   conversationId: nowConversationRef.current?.conversationId,
          //   title: messageStateRef?.current?.pendingMsg
          // })
        }

        return
      }

      // 流式更新消息
      setMessageState((state) => {
        return {
          ...state,
          pendingMsg: (state.pendingMsg ?? "") + msg?.message
        }
      })

      // 只有在聊天场景下，才需要更新最后一条消息
      if (messageStateRef.current?.taskType === TASK_TYPE.CHAT) {
        if (messageStateRef.current.pendingFirstToken) {
          const lastReplyMessage = messageStateRef.current.pendingReplyMsg

          lastReplyMessage.data.content =
            lastReplyMessage?.data?.content + msg?.message

          setMessages((messages) => {
            scrollToBottom()
            const savedMessage = messages

            return [...savedMessage, { ...lastReplyMessage }]
          })
        } else {
          setMessages((messages) => {
            scrollToBottom()

            const lastMessage = messages.at(-1)
            const savedMessage = messages.slice(0, -1)

            lastMessage.data.content = lastMessage?.data?.content + msg?.message

            return [...savedMessage, { ...lastMessage }]
          })
        }
      }

      // 已经收到消息，将 pendingFirstToken 设置为 false
      if (messageStateRef.current.pendingFirstToken) {
        setMessageState((state) => {
          return {
            ...state,
            pendingFirstToken: false
          }
        })
        messageStateRef.current.pendingFirstToken = false
      }
    })
  }

  // 设定主题样式s
  useSwitchTheme()

  // 页面状态和 conversationId 是同步的
  /**
   * 以下几种情况会新建会话 Id：
   * 1. 打开一个新的 quickAction
   * 2. 开启聊天窗口（侧边栏、浮框、或者 Options 页）
   *
   * 页面状态和会话 Id 是绑定的：
   * - messages
   * - messageState
   * - selectedText
   * - popupVisible
   * - newQAText
   * - currentMode
   */
  useEffect(() => {
    setMessages([])
    setMessageState(defaultMessageState)
    setSelectedText("")
    setQuickActionToolbarVisible(false)
    setPopupVisible(false)
    setNewQAText(() => "")
    setCurrentMode(defaultMode)

    isGenTitleRef.current = false // 新会话默认是没有创建 title 的状态
  }, [nowConversation?.conversationId])

  // Fix closure issue
  useEffect(() => {
    if (
      extensionMessage?.data?.name === "runRefly" &&
      extensionMessage?.data?.toggle
    ) {
      setIsShowSide((isShowSide) => !isShowSide)
    }
  }, [extensionMessage?.data])

  // 暂时处理闭包，后续替换
  useEffect(() => {
    newQATextRef.current = newQAText
  }, [newQAText])
  useEffect(() => {
    selectedTextRef.current = selectedText
  }, [selectedText])
  useEffect(() => {
    defaultModeRef.current = defaultMode
  }, [defaultMode])

  useEffect(() => {
    currentModeRef.current = currentMode
  }, [currentMode])
  useEffect(() => {
    messageStateRef.current = messageState
  }, [messageState?.pendingMsg])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  useEffect(() => {
    nowConversationRef.current = nowConversation
  }, [nowConversation])
  useEffect(() => {
    bindMouseEvent()
    bindExtensionPorts()
    loadCommands()

    return () => {
      window.removeEventListener("mouseup", handleMouseUp, { capture: true })
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      })
    }
  }, [])

  useEffect(() => {
    // Sidebar 唤起后更改 html 宽度，达到挤压的效果
    const html = document.querySelector("html")
    html.style.position = "relative"
    html.style.minHeight = "100vh"
    if (isShowSide) {
      const { clientWidth = 0 } =
        document
          .querySelector("plasmo-csui")
          ?.shadowRoot?.querySelector(".main") || {}
      html.style.width = `calc(100vw - ${clientWidth}px)`
    } else {
      html.style.width = "100vw"
    }
  }, [isShowSide])

  return (
    <div className="light">
      {quickActionToolbarVisible && (
        <QuickAction
          currentMode={currentMode}
          defaultMode={defaultMode}
          setCurrentMode={(mode) => {
            setCurrentMode(mode)
          }}
          handleMenuItemClick={handleMenuItemClick}
          handleChangeDefaultMode={handleChangeDefaultMode}
          popupVisible={popupVisible}
          setPopupVisible={(val) => setPopupVisible(val)}
          selectedText={selectedText}
          quickActionToolbarVisible={quickActionToolbarVisible}
          setQuickActionToolbarVisible={(val) =>
            setQuickActionToolbarVisible(val)
          }
          handleInputChange={handleInputChange}
          messageState={messageState}
          handleQuickActionGenResponse={handleQuickActionGenResponse}
          isShowSide={isShowSide}
          setIsShowSide={(val) => setIsShowSide(val)}
          barPosition={barPosition}
          handleBarFuncClick={handleBarFuncClick}
          continueChatFromQuickAction={continueChatFromQuickAction}
          handleShutdownGenReponseTask={handleShutdownGenReponseTask}
        />
      )}

      <div
        className={selectedText ? "entry active" : "entry"}
        onClick={(_) => setIsShowSide(!isShowSide)}>
        <img src={Logo} alt="唤起 Refly" style={{ width: 25, height: 25 }} />
        <span>⌘B</span>
      </div>

      <div className={isShowSide ? "main active" : "main"}>
        <Chat
          conversationListInstanceRef={conversationListInstanceRef}
          newQAText={newQAText}
          selectedText={selectedText}
          setSelectedText={(val) => setSelectedText(() => val)}
          setIsShowSide={(val) => setIsShowSide(val)}
          handleCreateNewConversation={handleCreateNewConversation}
          handleSideInputChange={handleSideInputChange}
          messages={messages}
          messageState={messageState}
          isShowSider={isShowSide}
          handleSideSendMessage={handleSideSendMessage}
          buildIntentQuickActionTaskAndGenReponse={
            buildIntentQuickActionTaskAndGenReponse
          }
          handleShutdownGenReponseTask={handleShutdownGenReponseTask}
        />
      </div>
    </div>
  )
}

export default Content
