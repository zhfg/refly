import React, { useRef } from "react"
import { Button, Space, Input } from "@arco-design/web-react"
import { IconSend } from "@arco-design/web-react/icon"

// stores
import { useChatStore } from "@/stores/chat"
import { useMessageStateStore } from "@/stores/message-state"
// 组件
import { Session } from "./session"
import { type SessionItem } from "@/types"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input"
import { IconTip } from "../dashboard/icon-tip"

interface ThreadItemProps {
  sessions: SessionItem[]
}

const TextArea = Input.TextArea

export const DigestDetailContent = (props: ThreadItemProps) => {
  const { sessions } = props
  const inputRef = useRef<RefTextAreaType>(null)
  const chatStore = useChatStore()

  const messageStateStore = useMessageStateStore()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
  }

  // 这里就不是直接构建聊天，而是弹框让用户确认，然后走进度条的形式进行加载，搞个全局进度条
  const handleAskFollowing = () => {}

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
                placeholder="创建新会话并追问..."
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
                  <IconTip text="创建新会话并追问">
                    <Button
                      shape="circle"
                      icon={<IconSend />}
                      style={{ color: "#FFF", background: "#00968F" }}
                      onClick={handleAskFollowing}></Button>
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
