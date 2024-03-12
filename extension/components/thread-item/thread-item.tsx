import React, { useRef } from "react"
import { Button, Skeleton, Space, Input } from "@arco-design/web-react"
import { IconMinusCircle, IconSend } from "@arco-design/web-react/icon"

// stores
import { useChatStore } from "~stores/chat"
import { useMessageStateStore } from "~stores/message-state"
// 组件
import { Session } from "./session"
import { TASK_TYPE, type SessionItem, type Task } from "~types"
import type { PlasmoGetStyle } from "plasmo"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input"
import { useBuildTask } from "~hooks/use-build-task"
import { buildQuickActionTask } from "~utils/task"

interface ThreadItemProps {
  sessions: SessionItem[]
}

const TextArea = Input.TextArea

export const ThreadItem = (props: ThreadItemProps) => {
  const { sessions } = props
  const inputRef = useRef<RefTextAreaType>()
  const chatStore = useChatStore()
  const messageStateStore = useMessageStateStore()
  const { buildShutdownTaskAndGenResponse, buildTaskAndGenReponse } =
    useBuildTask()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
  }

  const handleAskFollowing = () => {
    // TODO: 这里需要 follow 之前的 filter 进行提问
    const question = chatStore.newQAText
    const task = buildQuickActionTask({ question })

    buildTaskAndGenReponse(task)
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

      <div className="footer input-panel">
        {messageStateStore?.pending && (
          <div className="actions">
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
        )}

        <div className="session-input-box">
          <div className="session-inner-input-box">
            <TextArea
              ref={inputRef}
              className="message-input"
              autoFocus
              disabled={messageStateStore?.pending}
              value={chatStore?.newQAText}
              onChange={(value) => {
                chatStore.setNewQAText(value)
              }}
              placeholder="继续提问..."
              onKeyDownCapture={(e) => handleKeyDown(e)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{
                borderRadius: 8,
                resize: "none",
                backgroundColor: "transparent",
              }}></TextArea>
            <div>
              <div className="toolbar">
                <Space></Space>
                <Button
                  shape="circle"
                  icon={<IconSend />}
                  style={{ color: "#FFF", background: "#00968F" }}
                  onClick={handleAskFollowing}></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
