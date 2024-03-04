import {
  Button,
  Input,
  Message as message,
  Space,
  Tooltip,
  Avatar,
  Alert
} from "@arco-design/web-react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import {
  IconMinusCircle,
  IconUpload,
  IconSend
} from "@arco-design/web-react/icon"
import React, { useEffect, useRef, useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { useNavigate } from 'react-router-dom';

import {
  MessageItemType,
  TASK_TYPE,
  type Message,
} from "~/types"

// 自定义方法
import { getPopupContainer, scrollToBottom } from "~utils/ui"

// 自定义组件
import ConversationList from "../conversation-list"
import WeblinkList from "../weblink-list"
import {
  ErrorMessage,
  IntentMessage,
  QuestionMessage,
  ReplyMessage
} from "./message-list"
import { ChatHeader } from './header'
// utils
import { getLoadingStatusText } from "./utils"
import { buildConversation } from "~utils/conversation"
// stores
import { useQuickActionStore } from '../../stores/quick-action'
import { useChatStore } from '../../stores/chat'
import { useConversationStore } from "~stores/conversation"
import { useSiderSendMessage } from '~hooks/use-sider-send-message'
import { useMessageStateStore } from "~stores/message-state"
import { useSiderStore } from "~stores/sider"
// hooks
import { useBuildTask } from "~hooks/use-build-task"
import { useResetState } from '~hooks/use-reset-state'
import { useWebLinkIndexed } from '~hooks/use-weblink-indexed'
import type { PlasmoGetStyle } from "plasmo"
import { IconTip } from "./icon-tip"

const TextArea = Input.TextArea

type ChatProps = {
}

const Home = (props: ChatProps) => {
  const inputRef = useRef<RefTextAreaType>()
  const weblinkListRef = useRef(null)
  const conversationListInstanceRef = useRef(null);
  const [uploadingStatus, setUploadingStatus] = useState<
    "normal" | "loading" | "failed" | "success"
  >("normal")
  const navigate = useNavigate();

  // 网页索引状态
  const { isWebLinkIndexed, setIsWebLinkIndexed } = useWebLinkIndexed();

  const quickActionStore = useQuickActionStore();
  const chatStore = useChatStore();
  const conversationStore = useConversationStore();
  const messageStateStore = useMessageStateStore();
  const siderStore = useSiderStore();
  // hooks
  const { resetState } = useResetState()
  const { handleSideSendMessage } = useSiderSendMessage();


  const { buildIntentQuickActionTaskAndGenReponse, buildShutdownTaskAndGenResponse } = useBuildTask()
  const isIntentActive = !!quickActionStore.selectedText
  console.log("selectedText", quickActionStore.selectedText)

  const renderMessage = (type: MessageItemType, message: Message) => {
    switch (type) {
      // case MessageType.Example:
      //   return ExampleQuestionItem(message)
      case MessageItemType.REPLY:
        return ReplyMessage(message)
      case MessageItemType.QUESTION:
        return QuestionMessage(message)
      case MessageItemType.INTENT:
        return IntentMessage(message)
      case MessageItemType.ERROR:
        return ErrorMessage(message)
    }
  }

  /**
   * 1. 以下几种情况会新建会话 Id：
   *      1. 打开一个新的 quickAction
   *      2. 开启聊天窗口（侧边栏、浮框、或者 Options 页）
   * 2. 直到第一次调用 /generate/gen 接口生成响应的时候，才将会话 id 传给服务端保存一个会话
   */
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
  const handleCreateNewConversation = async () => {
    /**
     * 1. 创建新 thread，设置状态
     * 2. 跳转到 thread 界面，进行第一个回复，展示 问题、sources、答案
     */
    const question = chatStore.newQAText;
    const newConversationPayload = buildConversation()

    // 创建新会话
    const res = await sendToBackground({
      name: "createNewConversation",
      body: newConversationPayload
    })

    if (!res?.success) {
      message.error({
        content: '创建新会话失败！',
      })
      return;
    }

    console.log('createNewConversation', res)
    conversationStore.setCurrentConversation(res?.data);

    // 清空之前的状态
    resetState();


    // 更新新的 newQAText，for 新会话跳转使用
    chatStore.setNewQAText(question);
    chatStore.setIsNewConversation(true);
    navigate(`/thread/${newConversationPayload?.conversationId}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
  }

  const handleUploadWebsite = async (url: string) => {
    // setIsUpdatingWebiste(true)
    setUploadingStatus("loading")

    const res = await sendToBackground({
      name: "storeWeblink",
      body: {
        url
      }
    })

    if (res.success) {
      message.success('阅读成功！');
      setIsWebLinkIndexed(false);
    } else {
      message.error('阅读失败！');
    }

    setTimeout(() => {
      setUploadingStatus("normal")
    }, 3000)
  }

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && siderStore.showSider) inputRef?.current?.focus?.()
  }, [siderStore.showSider])
  // 如果有展示意图，那么也需要滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [isIntentActive])


  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}>
      <ChatHeader />
      {/* <div
        className="chat-wrapper"
        style={{ paddingBottom: isIntentActive ? 72 : 52 }}>
        <div className="chat chat-light">
          <div className="chat-box">
            <div className="wrapper">
              <div className="chat-container">
                {messages.map((msg, idx) => (
                  <div className={msg?.itemType + "-message"} key={idx}>
                    {renderMessage(msg?.itemType, msg)}
                  </div>
                ))}
                {messageState.taskType === TASK_TYPE.CHAT &&
                  messageState?.pendingFirstToken && (
                    <div className={"loading-message"}>{LoadingMessage()}</div>
                  )}
                {isIntentActive && (
                  <DynamicIntentMsgList
                    intentText={selectedText}
                    setSelectedText={setSelectedText}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="footer input-panel">
        {isWebLinkIndexed ? <Alert type="success" content="此网页已经被索引，可以直接提问！" closable /> : <Alert type="warning" content="此网页未索引，点击下方「阅读」可索引！" closable />}
        <div className="refly-slogan">The answer engine for your work</div>
        <div className="actions">
          {/* {isIntentActive && (
            <div className="intent">
              <div className="action-bar">
                <div className="action-box">
                  {modeList.map((modeItem, index) => (
                    <Button
                      key={index}
                      size="mini"
                      type="outline"
                      className="action-btn"
                      onClick={() =>
                        buildIntentQuickActionTaskAndGenReponse(
                          modeItem?.prompt
                        )
                      }>
                      {modeItem.text}
                    </Button>
                  ))}
                </div>
                <div className="action-popover"></div>
              </div>
            </div>
          )} */}
          {messageStateStore.taskType === TASK_TYPE.CHAT &&
            messageStateStore?.pending && (
              <div className="stop-reponse">
                <Button
                  type="outline"
                  className="btn"
                  icon={<IconMinusCircle />}
                  onClick={buildShutdownTaskAndGenResponse}>
                  停止响应
                </Button>
              </div>
            )}
        </div>

        <div className="input-box">
          <TextArea
            ref={inputRef}
            className="message-input"
            autoFocus
            value={chatStore?.newQAText}
            onChange={(value) => {
              chatStore.setNewQAText(value);
            }}
            placeholder="基于网页进行提问任何内容..."
            onKeyDownCapture={(e) => handleKeyDown(e)}
            autoSize={{ minRows: 4, maxRows: 4 }}
            style={{ borderRadius: 8, resize: "none", minHeight: 98, height: 98 }}></TextArea>
          <div>
            <div className="toolbar">
              <Space>
                {/* <Button
                  onClick={() => {
                    handleCreateNewConversation()
                  }}
                  icon={<IconPlus />}
                  type="text"
                  shape="round">
                  新会话
                </Button> */}

                <IconTip text='处理当前网页用于问答' >
                  <Button
                    onClick={() => {
                      handleUploadWebsite(window.location.href)
                    }}
                    icon={<IconUpload />}
                    loading={uploadingStatus === 'loading' ? true : false}
                    type="text"
                    style={{ marginRight: 0 }}
                    shape="round">
                    {uploadingStatus === 'loading' ? '阅读中' : '阅读'}
                  </Button>
                </IconTip>

                {/** 第一版本不支持选择指定网页进行问答 */}
                {/* <Button
                  onClick={() => {
                    weblinkListRef.current?.setVisible(true)
                  }}
                  icon={<IconUpload />}
                  type="text"
                  shape="round">
                  选择
                </Button> */}
                {/* <Button
              onClick={() => {
                conversationListInstanceRef?.current?.setVisible(true)
              }}
              size="mini"
              icon={<IconClockCircle />}
              status="success"
              shape="round">
              历史记录
            </Button> */}
              </Space>
              <Button shape="circle" icon={<IconSend />} style={{ color: '#FFF', background: '#00968F' }} onClick={handleCreateNewConversation}></Button>

            </div>

          </div>
        </div>
      </div>

      <ConversationList
        ref={conversationListInstanceRef}
        getPopupContainer={() =>
          document
            .querySelector("plasmo-csui")
            ?.shadowRoot?.querySelector(".main")
        }
      />
      <WeblinkList
        ref={weblinkListRef}
        getPopupContainer={() =>
          document
            .querySelector("plasmo-csui")
            ?.shadowRoot?.querySelector(".main")
        }
      />
    </div>
  )
}

export default Home;
