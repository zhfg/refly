import {
  Avatar,
  Badge,
  Button,
  Input,
  Message as message,
  Space,
  Tooltip
} from "@arco-design/web-react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import {
  IconBulb,
  IconClockCircle,
  IconClose,
  IconCloseCircle,
  IconMessage,
  IconMinusCircle,
  IconPlus,
  IconUpload
} from "@arco-design/web-react/icon"
import React, { useEffect, useRef, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import {
  MessageItemType,
  TASK_TYPE,
  type Conversation,
  type Message,
  type MessageState
} from "~/types"
// 静态资源
import Logo from "~assets/logo.svg"
import CloseGraySVG from "~assets/side/close.svg"
import FullScreenSVG from "~assets/side/full-screen.svg"
import HelpSVG from "~assets/side/help.svg"
import NotificationSVG from "~assets/side/notification.svg"
import SendSVG from "~assets/side/send.svg"
import SettingGraySVG from "~assets/side/setting.svg"
import { systemExampleQuestions } from "~utils/message"
// 自定义方法
import { getPopupContainer, scrollToBottom } from "~utils/ui"

// 自定义组件
import ConversationList from "../conversation-list"
import { modeList } from "../quick-action"
import WeblinkList from "../weblink-list"
import { IconTip } from "./icon-tip"
import {
  ErrorMessage,
  ExampleQuestionItem,
  IntentMessage,
  LoadingMessage,
  QuestionMessage,
  ReplyMessage
} from "./message-list"
import { getLoadingStatusText } from "./utils"

const TextArea = Input.TextArea

type ChatProps = {
  newQAText: string
  isShowSider: boolean
  setIsShowSide: (isShowSide: boolean) => void
  handleCreateNewConversation: () => void
  handleSideInputChange: (value: string) => void
  messages: Message[]
  messageState: MessageState
  conversationListInstanceRef: any
  selectedText: string
  setSelectedText: (val: string) => void
  buildIntentQuickActionTaskAndGenReponse: (questionContent: string) => void
  handleSideSendMessage: (question?: string) => void
  handleShutdownGenReponseTask: () => void
}

const Chat = (props: ChatProps) => {
  const inputRef = useRef<RefTextAreaType>()
  const weblinkListRef = useRef(null)
  const [isUploadingWebsite, setIsUpdatingWebiste] = useState<boolean>(false)
  const [uploadingStatus, setUploadingStatus] = useState<
    "normal" | "loading" | "failed" | "success"
  >("normal")

  const {
    newQAText,
    isShowSider,
    setIsShowSide,
    handleCreateNewConversation,
    handleSideInputChange,
    messages = [],
    conversationListInstanceRef,
    selectedText,
    setSelectedText,
    buildIntentQuickActionTaskAndGenReponse,
    handleSideSendMessage,
    messageState,
    handleShutdownGenReponseTask
  } = props

  const isIntentActive = !!selectedText
  console.log("selectedText", selectedText)

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
  }

  const handleUploadWebsite = async (url: string) => {
    setIsUpdatingWebiste(true)
    setUploadingStatus("loading")

    const res = await sendToBackground({
      name: "storeWeblink",
      body: {
        url
      }
    })

    if (res.success) {
      setUploadingStatus("success")
    } else {
      setUploadingStatus("failed")
    }

    setTimeout(() => {
      setUploadingStatus("normal")
    }, 3000)
  }

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && isShowSider) inputRef?.current?.focus?.()
  }, [isShowSider])
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
      <header>
        <div className="brand">
          <img src={Logo} alt="Refly" />
          <span>Refly</span>
        </div>
        <div className="funcs">
          {/* <IconTip text="全屏">
            <img src={FullScreenSVG} alt="全屏" />
          </IconTip>
          <IconTip text="通知">
            <img src={NotificationSVG} alt="通知" />
          </IconTip>
          <IconTip text="设置">
            <img src={SettingGraySVG} alt="设置" />
          </IconTip>
          <IconTip text="账户">
            <Avatar size={16}>
              <img
                alt="avatar"
                src="//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
              />
            </Avatar>
          </IconTip> */}
          <IconTip text="关闭">
            <img
              src={CloseGraySVG}
              alt="关闭"
              onClick={(_) => setIsShowSide(false)}
            />
          </IconTip>
        </div>
      </header>

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
        <div className="refly-slogan">The answer engine for your work</div>
        <div className="actions">
          {isIntentActive && (
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
          )}
          {messageState.taskType === TASK_TYPE.CHAT &&
            messageState?.pending && (
              <div className="stop-reponse">
                <Button
                  type="outline"
                  className="btn"
                  icon={<IconMinusCircle />}
                  onClick={handleShutdownGenReponseTask}>
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
            value={newQAText}
            onChange={handleSideInputChange}
            placeholder="基于网页进行提问任何内容..."
            onKeyDownCapture={(e) => handleKeyDown(e)}
            autoSize={{ minRows: 4, maxRows: 4 }}
            style={{ borderRadius: 8, resize: "none" }}></TextArea>
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
                <Tooltip
                  mini
                  position={"top"}
                  content={getLoadingStatusText(uploadingStatus)}
                  popupVisible={uploadingStatus !== "normal"}
                  getPopupContainer={getPopupContainer}>
                  <Button
                    onClick={() => {
                      handleUploadWebsite(window.location.href)
                    }}
                    icon={<IconUpload />}
                    type="text"
                    style={{ marginRight: 0 }}
                    shape="round">
                    阅读
                  </Button>
                </Tooltip>

                <Button
                  onClick={() => {
                    weblinkListRef.current?.setVisible(true)
                  }}
                  icon={<IconUpload />}
                  type="text"
                  shape="round">
                  选择
                </Button>
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

export default Chat
