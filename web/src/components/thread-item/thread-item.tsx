import React, { useEffect, useRef, useState } from "react"
import { Button, Space, Input } from "@arco-design/web-react"
import { IconMinusCircle, IconSend } from "@arco-design/web-react/icon"

// stores
import { useChatStore } from "@/stores/chat"
import { useMessageStateStore } from "@/stores/message-state"
// 组件
import { Session } from "./session"
import { TASK_TYPE, type SessionItem, type Source } from "@/types"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input"
import { useBuildTask } from "@/hooks/use-build-task"

import { ThreadSearchTargetSelector } from "@/components/thread-item/thread-search-target-selector"
import { SearchTarget } from "@/stores/search-state"
// 自定义组件
import { SelectedWeblink } from "../selected-weblink/index"

interface ThreadItemProps {
  sessions: SessionItem[]
  selectedWeblinkConfig: {
    searchTarget: SearchTarget
    filter: Source[]
  }
  handleAskFollowing: (question?: string, taskType?: TASK_TYPE) => void
}

const TextArea = Input.TextArea

export const ThreadItem = (props: ThreadItemProps) => {
  const { sessions, selectedWeblinkConfig } = props
  const inputRef = useRef<RefTextAreaType>(null)
  const selectedWeblinkListRef = useRef<HTMLDivElement>(null)
  const chatStore = useChatStore()
  const [addedStyle, setAddedStyle] = useState({})

  const [threadSearchTarget, setThreadSearchTarget] = useState(
    selectedWeblinkConfig?.searchTarget,
  )
  const [threadWeblinkListFilter, setThreadWeblinkListFilter] = useState(
    selectedWeblinkConfig?.filter || [],
  )

  const showSelectedWeblinkList =
    threadSearchTarget === SearchTarget.SelectedPages &&
    threadWeblinkListFilter?.length > 0

  const messageStateStore = useMessageStateStore()
  const { buildShutdownTaskAndGenResponse } = useBuildTask()

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
      handleAskFollowing()
    }
  }

  const handleAskFollowing = () => {
    props.handleAskFollowing(
      "",
      threadSearchTarget === SearchTarget?.SearchEnhance
        ? TASK_TYPE.SEARCH_ENHANCE_ASK
        : TASK_TYPE.CHAT,
    )
  }

  // 这里保存为组件状态是只对当前组件生效，而且理论上设置之后就应该在此 thread 一直生效，不应该清空
  useEffect(() => {
    if (!threadSearchTarget && selectedWeblinkConfig?.searchTarget) {
      setThreadSearchTarget(props.selectedWeblinkConfig?.searchTarget)
    }

    if (
      (!threadWeblinkListFilter || threadWeblinkListFilter?.length <= 0) &&
      selectedWeblinkConfig?.filter?.length > 0
    ) {
      setThreadWeblinkListFilter(selectedWeblinkConfig.filter)
    }
  }, [selectedWeblinkConfig?.searchTarget, selectedWeblinkConfig?.filter])

  useEffect(() => {
    setAddedStyle(
      showSelectedWeblinkList
        ? {
            height: `calc(100vh - 90px - ${selectedWeblinkListRef?.current?.clientHeight || 0}px - 60px)`,
          }
        : {},
    )
  }, [showSelectedWeblinkList])

  return (
    <div className="session-container">
      <div className="session-inner-container" style={addedStyle}>
        {sessions?.map((item, index) => (
          <Session
            key={index}
            session={item}
            handleAskFollowing={question =>
              props.handleAskFollowing(
                question,
                threadSearchTarget === SearchTarget?.SearchEnhance
                  ? TASK_TYPE.SEARCH_ENHANCE_ASK
                  : TASK_TYPE.CHAT,
              )
            }
            isLastSession={index === sessions.length - 1}
          />
        ))}
      </div>

      <div className="">
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
          <div className="session-input-inner">
            <div className="session-input-content">
              <div className="session-inner-input-box">
                <ThreadSearchTargetSelector
                  showText={false}
                  searchTarget={threadSearchTarget}
                  handleChangeSelector={searchTarget =>
                    setThreadSearchTarget(searchTarget)
                  }
                />
                <TextArea
                  ref={inputRef}
                  className="message-input"
                  autoFocus
                  disabled={messageStateStore?.pending}
                  value={chatStore?.newQAText}
                  onChange={value => {
                    chatStore.setNewQAText(value)
                  }}
                  placeholder="继续提问..."
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
                    <Button
                      shape="circle"
                      icon={<IconSend />}
                      style={{ color: "#FFF", background: "#00968F" }}
                      onClick={() => {
                        handleAskFollowing()
                      }}></Button>
                  </div>
                </div>
              </div>
              {showSelectedWeblinkList ? (
                <SelectedWeblink
                  ref={selectedWeblinkListRef}
                  closable={false}
                  selectedWeblinkList={threadWeblinkListFilter}
                />
              ) : null}
            </div>
            <div className="session-inner-input-placeholder"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
