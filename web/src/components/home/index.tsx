import {
  Button,
  Input,
  Message as message,
  Space,
  Alert,
  Tag,
} from "@arco-design/web-react"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input/textarea"
import {
  IconMinusCircle,
  IconUpload,
  IconSend,
  IconRightCircle,
  IconLink,
} from "@arco-design/web-react/icon"
import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Conversation, TASK_TYPE } from "@/types"

// 自定义组件
import WeblinkList from "../weblink-list"
// utils
import { buildConversation } from "@/utils/conversation"
// stores
import { useChatStore } from "../../stores/chat"
import { useConversationStore } from "@/stores/conversation"
import { useMessageStateStore } from "@/stores/message-state"
import { useSiderStore } from "@/stores/sider"
import { useWeblinkStore } from "@/stores/weblink"
// hooks
import { useBuildTask } from "@/hooks/use-build-task"
import { useResetState } from "@/hooks/use-reset-state"
import { useWebLinkIndexed } from "@/hooks/use-weblink-indexed"
import { IconTip } from "./icon-tip"
// 组件
import { SearchTargetSelector } from "./search-target-selector"
// request
import createNewConversation from "@/requests/createNewConversation"
import storeWeblink from "@/requests/storeWeblink"
// scss
import "./index.scss"
import classNames from "classnames"

const TextArea = Input.TextArea

const Home = () => {
  const inputRef = useRef<RefTextAreaType>(null)
  const [isFocused, setIsFocused] = useState(false)
  const weblinkListRef = useRef(null)
  const [uploadingStatus, setUploadingStatus] = useState<
    "normal" | "loading" | "failed" | "success"
  >("normal")
  const navigate = useNavigate()

  // 网页索引状态
  const { isWebLinkIndexed, setIsWebLinkIndexed } = useWebLinkIndexed()

  const chatStore = useChatStore()
  const conversationStore = useConversationStore()
  const messageStateStore = useMessageStateStore()
  const siderStore = useSiderStore()
  const webLinkStore = useWeblinkStore()
  // hooks
  const { resetState } = useResetState()

  const { buildShutdownTaskAndGenResponse } = useBuildTask()

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
    const question = chatStore.newQAText
    const newConversationPayload = buildConversation()

    // 创建新会话
    const res = await createNewConversation({
      body: newConversationPayload,
    })

    if (!res?.success) {
      message.error({
        content: "创建新会话失败！",
      })
      return
    }

    console.log("createNewConversation", res)
    conversationStore.setCurrentConversation(res?.data as Conversation)

    // 清空之前的状态
    resetState()

    // 更新新的 newQAText，for 新会话跳转使用
    chatStore.setNewQAText(question)
    chatStore.setIsNewConversation(true)
    navigate(`/thread/${newConversationPayload?.conversationId}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
  }

  const handleUploadWebsite = async (url: string) => {
    // setIsUpdatingWebiste(true)
    setUploadingStatus("loading")

    const description = document.head.querySelector('meta[name="description"]')

    const res = await storeWeblink({
      body: {
        url,
        origin: location?.origin || "", // 冗余存储策略，for 后续能够基于 origin 进行归类归档
        originPageTitle: document?.title || "",
        originPageUrl: location.href,
        originPageDescription: (description as any)?.content || "",
      },
    })

    if (res.success) {
      message.success("阅读成功！")
      setIsWebLinkIndexed(true)
    } else {
      message.error("阅读失败！")
    }

    setTimeout(() => {
      setUploadingStatus("normal")
    }, 3000)
  }

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && siderStore.showSider) inputRef?.current?.focus?.()
  }, [siderStore.showSider])

  return (
    <div className="home-container" style={{}}>
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

        <div
          className={classNames("input-box-container", {
            "is-focused": isFocused,
          })}>
          <div
            className={classNames("input-box", {
              "is-focused": isFocused,
            })}>
            <TextArea
              ref={inputRef}
              className="message-input"
              autoFocus
              value={chatStore?.newQAText}
              onChange={value => {
                chatStore.setNewQAText(value)
              }}
              placeholder="基于网页进行提问任何内容..."
              onKeyDownCapture={e => handleKeyDown(e)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{
                borderRadius: 8,
                resize: "none",
              }}></TextArea>
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

                  {/** 第一版本不支持选择指定网页进行问答 */}
                  <SearchTargetSelector />
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
                <Button
                  shape="circle"
                  icon={<IconSend />}
                  style={{ color: "#FFF", background: "#00968F" }}
                  onClick={handleCreateNewConversation}></Button>
              </div>
            </div>
          </div>
        </div>
        {webLinkStore?.selectedRow?.length > 0 && (
          <div className="selected-weblinks-container">
            <div className="selected-weblinks-inner-container">
              <div className="hint-item">
                <IconRightCircle style={{ color: "rgba(0, 0, 0, .6)" }} />
                <span>基于选中网页提问：</span>
              </div>
              {webLinkStore?.selectedRow.map((item, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => {}}
                  icon={<IconLink />}
                  bordered
                  color="gray">
                  <a
                    rel="noreferrer"
                    href={item?.content?.originPageUrl}
                    target="_blank"
                    className="selected-weblink-item">
                    <img
                      className="icon"
                      src={`https://www.google.com/s2/favicons?domain=${item?.content.origin}&sz=${16}`}
                      alt=""
                    />
                    <span className="text">
                      {item?.content?.originPageTitle}
                    </span>
                  </a>
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>

      <WeblinkList ref={weblinkListRef} />
    </div>
  )
}

export default Home
