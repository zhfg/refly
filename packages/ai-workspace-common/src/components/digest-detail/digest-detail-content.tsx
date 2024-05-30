import React, { useRef } from "react"
import {
  Button,
  Space,
  Input,
  Message as message,
} from "@arco-design/web-react"
import { IconSend } from "@arco-design/web-react/icon"

// stores
import { useChatStore } from "@/stores/chat"
import { useMessageStateStore } from "@/stores/message-state"
// 组件
import { Session } from "./session"
import { type SessionItem } from "@/types"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input"
import { IconTip } from "../dashboard/icon-tip"
import { safeParseJSON } from "@/utils/parse"
import { useUserStore } from "@/stores/user"
import { useQuickSearchStateStore } from "@/stores/quick-search-state"
import { useTranslation } from "react-i18next"

interface ThreadItemProps {
  sessions: SessionItem[]
  handleAskFollowUp: () => void
}

const TextArea = Input.TextArea

export const DigestDetailContent = (props: ThreadItemProps) => {
  const { sessions } = props
  const inputRef = useRef<RefTextAreaType>(null)
  const chatStore = useChatStore()
  const userStore = useUserStore()

  const messageStateStore = useMessageStateStore()
  const quickSearchStateStore = useQuickSearchStateStore()

  const { t } = useTranslation()

  // 获取 storage user profile
  const storageUserProfile = safeParseJSON(
    localStorage.getItem("refly-user-profile"),
  )
  const notShowLoginBtn = storageUserProfile?.uid || userStore?.userProfile?.uid
  console.log("storageUserProfile", storageUserProfile, userStore?.userProfile)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.keyCode === 13 && (e.ctrlKey || e.shiftKey || e.metaKey)) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // 阻止默认行为,即不触发 enter 键的默认事件
        e.preventDefault()
        // 在输入框中插入换行符

        // 获取光标位置
        const cursorPos = e.target.selectionStart
        // 在光标位置插入换行符
        e.target.value =
          e.target.value.slice(0, cursorPos as number) +
          "\n" +
          e.target.value.slice(cursorPos as number)
        // 将光标移动到换行符后面
        e.target.selectionStart = e.target.selectionEnd =
          (cursorPos as number) + 1
      }
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault()
      handleAskFollowUp()
    }

    if (e.keyCode === 75 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      quickSearchStateStore.setVisible(true)
    }
  }

  // 这里就不是直接构建聊天，而是弹框让用户确认，然后走进度条的形式进行加载，搞个全局进度条
  // 这里就不是直接构建聊天，而是弹框让用户确认，然后走进度条的形式进行加载，搞个全局进度条
  const handleAskFollowUp = () => {
    /**
     * 1. 【Optional - 后续可能去掉】弹框让用户确认，是否需要创建会话并跳转
     * 2. 跳转之前需要发起请求创建新会话，并显示 loading
     * 3. 带着问题跳转过去
     */
    if (!chatStore?.newQAText) {
      message.warning(t("contentDetail.item.askFollow.emptyNotify"))
    } else {
      if (!notShowLoginBtn) {
        userStore.setLoginModalVisible(true)
      } else {
        props.handleAskFollowUp()
      }
    }
  }

  return (
    <div className="session-container">
      <div className="session-inner-container">
        {sessions?.map((item, index) => (
          <Session
            key={index}
            session={item}
            isLastSession={index === sessions.length - 1}
          />
        ))}
      </div>

      <div className="session-input-box">
        <div className="session-input-inner">
          <div className="session-input-content">
            <div className="session-inner-input-box">
              <TextArea
                ref={inputRef}
                className="message-input"
                autoFocus
                disabled={messageStateStore?.pending}
                value={chatStore?.newQAText}
                onChange={value => {
                  chatStore.setNewQAText(value)
                }}
                placeholder={t("contentDetail.item.input.placeholder")}
                onKeyDownCapture={e => handleKeyDown(e)}
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{
                  borderRadius: 8,
                  resize: "none",
                  backgroundColor: "transparent",
                }}></TextArea>
              <div>
                <div className="toolbar">
                  <Space></Space>
                  <IconTip text={t("contentDetail.item.input.btnTip")}>
                    <Button
                      shape="circle"
                      icon={<IconSend />}
                      style={{ color: "#FFF", background: "#00968F" }}
                      onClick={handleAskFollowUp}></Button>
                  </IconTip>
                </div>
              </div>
            </div>
          </div>
          <div className="session-inner-input-placeholder"></div>
        </div>
      </div>
    </div>
  )
}
