import React from 'react';
import {
    Button,
    Divider,
    Input,
    Spin,
    Typography
  } from "@arco-design/web-react"
  import {
    IconCheck,
    IconCopy,
    IconMessage,
    IconMinusCircle,
    IconRefresh,
  } from "@arco-design/web-react/icon"
  import Logo from "~assets/logo.svg"
  import CloseSVG from "~assets/menu-icons/close.svg"

import { useCountDown } from "~hooks/use-count-down"
import {
    ACTION_TYPE,
    TASK_TYPE,
    type Mode,
    type QUICK_ACTION,
  } from "~/types"
  // stores
import { usePopupStore } from '../../stores/popup'
import { useChatStore } from '../../stores/chat'
import { useSiderStore } from '../../stores/sider'
import { useMessageStateStore } from '../../stores/message-state'
import { useQuickActionStore } from '../../stores/quick-action'
import { useConversationStore } from '../../stores/conversation'
import { modeList } from './utils';
import { Markdown } from "../markdown"
import { IconTip } from '../chat/icon-tip';
import copyToClipboard from "copy-to-clipboard"
import { sendToBackground } from '@plasmohq/messaging';
import { useBuildTask } from '~hooks/use-build-task';
import { buildIntentMessageList, errorMessage } from '~utils/message';

const TextArea = Input.TextArea

interface PopupContentProps {
    handleQuickActionGenResponse: (taskType: TASK_TYPE,
        data: QUICK_ACTION) => void
}

export const PopupContent = (props: PopupContentProps) => {
    const [isAnswerCopyCountdown, setIsAnswerCopyCountdown] = useCountDown(3)
    const quickActionStore = useQuickActionStore();
  const popupStore = usePopupStore();
  const messageStateStore = useMessageStateStore();
  const chatStore = useChatStore();
  const conversationStore = useConversationStore();
  const siderStore = useSiderStore();
  const { buildGenTitleTaskAndGenResponse, buildShutdownTaskAndGenResponse } = useBuildTask();

  /**
   * 操作路径：
   * 0. 有基础的欢迎语
   * 1. 已经选中一段文字，并携带意图的推荐提问
   * 2. 基于这段文字已经提问（快捷操作），并获得了回答
   * 3. 打开聊天框，
   */
  const continueChatFromQuickAction = async () => {
    // 隐藏快捷操作框
    popupStore.setPopupVisible(false);
    quickActionStore.setToolbarVisible(false)
    quickActionStore.setSelectedText("");

    // TODO: /api/task/syncChatItems
    const oldMessages = chatStore.messages
    const conversationId = conversationStore?.currentConversation?.conversationId
    const selectionContent = quickActionStore.selectedText
    const questionContent = quickActionStore?.currentMode?.prompt
    const replyContent = messageStateStore.pendingMsg

    const intentMsgList = buildIntentMessageList({
      conversationId,
      selectionContent,
      questionContent,
      replyContent
    })

    const newMsgList = oldMessages.concat(intentMsgList)
    chatStore.setMessages(newMsgList);

    // 保持右侧 sider 框常开
    siderStore.setShowSider(true);

    // 进行消息同步
    const resp = await sendToBackground({
      name: "syncChatItems",
      body: { ...conversationStore.currentConversation, items: newMsgList }
    })

    // 为此会话生成 title
    buildGenTitleTaskAndGenResponse()
  }


    const ModeTagItem = (mode: Mode) => (
        <div
          className={
            mode?.text === quickActionStore.currentMode?.text
              ? "menu-tag-item active"
              : "menu-tag-item"
          }
          key={mode?.text}
          onClick={(_) => {
            props.handleQuickActionGenResponse(TASK_TYPE.QUICK_ACTION, {
              actionType: ACTION_TYPE.SELECTION,
              actionPrompt: mode.prompt,
              reference: quickActionStore.selectedText
            })
            quickActionStore.setCurrentMode(mode);
          }}>
          <span>{mode?.text}</span>
        </div>
      )
      const ModeTagItems = modeList.map((e) => ModeTagItem(e))

    return <div className="popup-content">
    <header>
      <div className="header-left">
        <img src={Logo} alt="Refly" style={{ width: 24, height: 24 }} />
        <span className="text-color">{quickActionStore.currentMode?.text}</span>
        {/* <img src={SettingSVG} alt="设置" /> */}
      </div>
      <div className="header-right">
        <img
          src={CloseSVG}
          alt="关闭"
          onClick={(_) => popupStore.setPopupVisible(false)}
        />
      </div>
    </header>

    <div className="funcs">{ModeTagItems}</div>

    <div className="input">
      <TextArea
        autoSize={{ maxRows: 5 }}
        defaultValue={quickActionStore.selectedText}
        onChange={(value) => quickActionStore.setSelectedText(value)}
        style={{ borderRadius: 8, resize: "none" }}
      />
    </div>

    <div className="output">
      <div className="output-bar">
        <div className="result">
          <span className="text-color text">结果</span>
          {messageStateStore.taskType === TASK_TYPE.QUICK_ACTION &&
            messageStateStore?.pending && <Spin size={14} className="loading" />}
        </div>
        <div>
          {messageStateStore.taskType === TASK_TYPE.QUICK_ACTION &&
            messageStateStore?.pending ? (
            <span
              className="stop-action"
              onClick={buildShutdownTaskAndGenResponse}>
              <IconMinusCircle className="icon" />
              <span className="text">停止</span>
            </span>
          ) : (
            <>
              <IconTip
                text={!isAnswerCopyCountdown ? "复制" : "已复制"}
                position="bottom">
                {!isAnswerCopyCountdown ? (
                  <IconCopy
                    className="user-action-btn"
                    onClick={() => {
                      setIsAnswerCopyCountdown(true)
                      copyToClipboard(messageStateStore?.pendingMsg)
                    }}
                  />
                ) : (
                  <IconCheck />
                )}
              </IconTip>
              <IconTip text="重试" position="bottom">
                <IconRefresh
                  className="user-action-btn"
                  onClick={(_) =>
                    props.handleQuickActionGenResponse(TASK_TYPE.QUICK_ACTION, {
                      actionType: ACTION_TYPE.SELECTION,
                      actionPrompt: quickActionStore.currentMode?.prompt,
                      reference: quickActionStore.selectedText
                    })
                  }
                />
              </IconTip>
            </>
          )}
        </div>
      </div>
      <div className="ouput-result">
        <Markdown content={messageStateStore?.pendingMsg} />
      </div>
    </div>

    {!messageStateStore.pending &&
      !messageStateStore.error &&
      messageStateStore.taskType === TASK_TYPE.QUICK_ACTION && (
        <>
          <Divider style={{ margin: "8px 0" }} />
          <div className="footer">
            <Button
              className="contine-chat-btn"
              shape="round"
              icon={<IconMessage />}
              long
              onClick={continueChatFromQuickAction}>
              在聊天中继续
            </Button>
          </div>
        </>
      )}
    {!messageStateStore.pending &&
      messageStateStore.error &&
      messageStateStore.taskType === TASK_TYPE.QUICK_ACTION && (
        <>
          <Divider style={{ margin: "8px 0" }} />
          <div className="footer">
            <Typography.Text type="error">{errorMessage}</Typography.Text>
          </div>
        </>
      )}
  </div>
}