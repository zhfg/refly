import React, { useEffect, useRef, useState } from "react"
import {
  Button,
  Skeleton,
  Space,
  Input,
  Breadcrumb,
} from "@arco-design/web-react"
import { IconMinusCircle, IconSend } from "@arco-design/web-react/icon"

// stores
import { useChatStore } from "~stores/chat"
import { useMessageStateStore } from "~stores/message-state"
// 组件
import { Session } from "./session"
import { TASK_TYPE, type SessionItem, type Task, type Source } from "~types"
import type { RefTextAreaType } from "@arco-design/web-react/es/Input"
import { useBuildTask } from "~hooks/use-build-task"
import { buildChatTask, buildQuickActionTask } from "~utils/task"
import { useConversationStore } from "~stores/conversation"
import { ThreadSearchTargetSelector } from "~components/thread-item/thread-search-target-selector"
import { SearchTarget } from "~stores/search-state"
// 自定义组件
import { SelectedWeblink } from "../selected-weblink/index"
import { useNavigate } from "react-router-dom"

interface ThreadItemProps {
  sessions: SessionItem[]
  selectedWeblinkConfig: {
    searchTarget: SearchTarget
    filter: Source[]
  }
}

const TextArea = Input.TextArea
const BreadcrumbItem = Breadcrumb.Item

export const ThreadItem = (props: ThreadItemProps) => {
  const { sessions, selectedWeblinkConfig } = props
  const inputRef = useRef<RefTextAreaType>()
  const selectedWeblinkListRef = useRef<HTMLDivElement>(null)
  const chatStore = useChatStore()
  const navigate = useNavigate()

  const [threadSearchTarget, setThreadSearchTarget] = useState(
    selectedWeblinkConfig?.searchTarget,
  )
  const [threadWeblinkListFilter, setThreadWeblinkListFilter] = useState(
    selectedWeblinkConfig?.filter || [],
  )
  const conversationStore = useConversationStore()

  const showSelectedWeblinkList =
    threadSearchTarget === SearchTarget.SelectedPages &&
    threadWeblinkListFilter?.length > 0

  const messageStateStore = useMessageStateStore()
  const { buildShutdownTaskAndGenResponse, buildTaskAndGenReponse } =
    useBuildTask()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    // inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
    if (e.keyCode === 13) {
      handleAskFollowing()
    }
  }

  const handleAskFollowing = () => {
    // TODO: 这里需要 follow 之前的 filter 进行提问
    const { newQAText } = useChatStore.getState()
    const { currentConversation } = useConversationStore.getState()
    const useWeblinkList =
      threadSearchTarget === SearchTarget.SelectedPages &&
      threadWeblinkListFilter?.length > 0

    const task = buildChatTask({
      question: newQAText,
      conversationId: currentConversation?.id || "",
      filter: {
        weblinkList: useWeblinkList ? threadWeblinkListFilter : [],
      },
    })

    buildTaskAndGenReponse(task)
    chatStore.setNewQAText("")
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

  console.log(
    "selectedWeblinkConfig",
    selectedWeblinkConfig,
    threadSearchTarget,
    threadWeblinkListFilter,
  )

  return (
    <div className="session-container">
      <div>
        <Breadcrumb style={{ padding: `8px 16px` }}>
          <BreadcrumbItem
            onClick={() => navigate("/thread")}
            className="breadcrum-item">
            会话库
          </BreadcrumbItem>
          <BreadcrumbItem
            className="breadcrum-item breadcrum-description"
            onClick={() =>
              navigate(`/thread/${conversationStore?.currentConversation?.id}`)
            }>
            <span>{conversationStore?.currentConversation?.title}</span>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div
        className="session-inner-container"
        style={
          showSelectedWeblinkList
            ? {
                height: `calc(100vh - 180px - ${selectedWeblinkListRef.current?.clientHeight || 0}px)`,
              }
            : {}
        }>
        {sessions?.map((item, index) => (
          <Session
            key={index}
            session={item}
            isLastSession={index === sessions.length - 1}
          />
        ))}
      </div>

      <div
        className="footer input-panel"
        style={
          showSelectedWeblinkList
            ? {
                height: `calc(100vh - 130px - ${selectedWeblinkListRef.current?.clientHeight || 0}px)`,
              }
            : {}
        }>
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
            <ThreadSearchTargetSelector
              showText={false}
              searchTarget={threadSearchTarget}
              handleChangeSelector={(searchTarget) =>
                setThreadSearchTarget(searchTarget)
              }
            />
            <TextArea
              ref={inputRef}
              className="message-input"
              autoFocus
              disabled={messageStateStore?.pending}
              value={chatStore?.newQAText}
              onChange={(value) => {
                chatStore.setNewQAText(value)
              }}
              onCompositionStart={(e) => console.log("composition start")}
              onCompositionUpdate={(e) => console.log("composition update")}
              onCompositionEnd={(e) => console.log("composition end")}
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
          {showSelectedWeblinkList ? (
            <SelectedWeblink
              ref={selectedWeblinkListRef}
              closable={false}
              selectedWeblinkList={threadWeblinkListFilter}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
