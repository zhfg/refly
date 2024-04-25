import React, { useEffect, useRef, useState } from "react"
import {
  Button,
  Skeleton,
  Space,
  Input,
  Breadcrumb,
  Message as message,
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
import { buildTask } from "~utils/task"
import { useConversationStore } from "~stores/conversation"
import { ThreadSearchTargetSelector } from "~components/thread-item/thread-search-target-selector"
import { SearchTarget } from "~stores/search-state"
// 自定义组件
import { SelectedWeblink } from "../selected-weblink/index"
import { useNavigate } from "react-router-dom"
import { ContentSelectorBtn } from "~components/content-selector-btn"
import { useSearchQuickActionStore } from "~stores/search-quick-action"
import { QuickAction } from "~components/home/quick-action"
import { useContentSelectorStore } from "~stores/content-selector"
import { SelectedContentList } from "~components/selected-content-list"
import { useStoreWeblink } from "~hooks/use-store-weblink"
import { useHomeStateStore } from "~stores/home-state"
import { useSelectedMark } from "~hooks/use-selected-mark"
import { useTranslation } from "react-i18next"
import { useUserStore } from "~stores/user"

interface ThreadItemProps {
  sessions: SessionItem[]
  selectedWeblinkConfig: {
    searchTarget: SearchTarget
    filter: Source[]
  }
  handleAskFollowing: (question?: string, taskType?: TASK_TYPE) => void
}

const TextArea = Input.TextArea
const BreadcrumbItem = Breadcrumb.Item

export const ThreadItem = (props: ThreadItemProps) => {
  const { sessions, selectedWeblinkConfig } = props
  const inputRef = useRef<RefTextAreaType>()
  const selectedWeblinkListRef = useRef<HTMLDivElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const [inputContainerHeight, setInputContainerHeight] = useState(0)
  const chatStore = useChatStore()
  const navigate = useNavigate()

  const { t } = useTranslation()

  const [threadSearchTarget, setThreadSearchTarget] = useState<SearchTarget>(
    selectedWeblinkConfig?.searchTarget,
  )
  const [threadWeblinkListFilter, setThreadWeblinkListFilter] = useState(
    selectedWeblinkConfig?.filter || [],
  )
  const homeStateStore = useHomeStateStore()

  // stores
  const conversationStore = useConversationStore()
  const searchQuickActionStore = useSearchQuickActionStore()
  const contentSelectorStore = useContentSelectorStore()
  const { handleResetState } = useSelectedMark()

  const showSelectedWeblinkList =
    threadSearchTarget === SearchTarget.SelectedPages &&
    threadWeblinkListFilter?.length > 0

  const messageStateStore = useMessageStateStore()
  const { buildShutdownTaskAndGenResponse, buildTaskAndGenReponse } =
    useBuildTask()

  const { handleUploadWebsite } = useStoreWeblink()

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
          e.target.value.slice(0, cursorPos) +
          "\n" +
          e.target.value.slice(cursorPos)
        // 将光标移动到换行符后面
        e.target.selectionStart = e.target.selectionEnd = cursorPos + 1
      }
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault()
      handleAskFollowing()
    }
  }

  const getInputText = () => {
    const { showSelectedMarks } = useContentSelectorStore.getState()
    const searchTarget = threadSearchTarget

    if (showSelectedMarks)
      return t(
        "translation:threadDetail.item.input.searchPlaceholder.currentSelectedContent",
      )
    if (searchTarget === SearchTarget.SelectedPages)
      return t(
        "translation:threadDetail.item.input.searchPlaceholder.selectedWeblink",
      )
    if (searchTarget === SearchTarget.CurrentPage)
      return t("translation:threadDetail.item.input.searchPlaceholder.current")
    if (searchTarget === SearchTarget.SearchEnhance)
      return t("translation:threadDetail.item.input.searchPlaceholder.internet")
    if (searchTarget === SearchTarget.All)
      return t("translation:threadDetail.item.input.searchPlaceholder.all")
  }

  const handleAskFollowing = async (question?: string) => {
    // TODO: 这里需要 follow 之前的 filter 进行提问
    const { newQAText: storeNewQAText } = useChatStore.getState()
    const { marks } = useContentSelectorStore.getState()
    const { localSettings } = useUserStore.getState()

    const newQAText = storeNewQAText || question
    if (!newQAText) {
      message.info(t("translation:threadDetail.item.input.status.emptyNotify"))
      return
    }

    const searchTarget = threadSearchTarget

    // 先存储 link， 在进行提问操作，这里理论上是需要有个 negotiate 的过程
    if (searchTarget === SearchTarget.CurrentPage) {
      message.loading(
        t("translation:threadDetail.item.input.status.contentHandling"),
      )
      const res = await handleUploadWebsite(window.location.href)

      if (res.success) {
        message.success(
          t(
            "translation:threadDetail.item.input.status.contentHandleSuccessNotify",
          ),
        )
      } else {
        message.error(
          t(
            "translation:threadDetail.item.input.status.contentHandleFailedNotify",
          ),
        )
      }
    }

    let selectedWebLink = []

    if (threadSearchTarget === SearchTarget.CurrentPage) {
      selectedWebLink = [
        {
          pageContent: "",
          metadata: {
            title: document?.title || "",
            source: location.href,
          },
          score: -1, // 手工构造
          selections: marks?.map((item) => ({
            type: "text",
            xPath: item?.xPath,
            content: item?.data,
          })),
        },
      ]
    } else {
      const useWeblinkList =
        threadSearchTarget === SearchTarget.SelectedPages &&
        threadWeblinkListFilter?.length > 0

      selectedWebLink = useWeblinkList ? threadWeblinkListFilter : []
    }

    const { currentConversation } = useConversationStore.getState()

    const task = buildTask({
      taskType:
        threadSearchTarget === SearchTarget.SearchEnhance
          ? TASK_TYPE.SEARCH_ENHANCE_ASK
          : TASK_TYPE.CHAT,
      data: {
        question: newQAText,
        conversationId: currentConversation?.id || "",
        filter: {
          weblinkList: selectedWebLink,
        },
      },
      locale: localSettings?.outputLocale,
    })

    // 清空选中状态
    handleResetState()
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
  // 这里更新状态
  useEffect(() => {
    if (inputContainerRef?.current) {
      setInputContainerHeight(inputContainerRef?.current?.clientHeight || 0)
    }
  }, [
    showSelectedWeblinkList,
    searchQuickActionStore.showQuickAction,
    contentSelectorStore?.showSelectedMarks,
  ])

  // 初始化的时候 inputContainerRef?.current 还未渲染，高度为 0
  const contentHeight = `calc(100vh - 66px - 40px - ${inputContainerHeight || 0 + 16}px`

  return (
    <div className="session-container">
      <div>
        <Breadcrumb style={{ padding: `8px 16px` }}>
          <BreadcrumbItem
            onClick={() => {
              navigate("/thread")
              homeStateStore.setActiveTab("session-library")
            }}
            className="breadcrum-item">
            {t("translation:threadDetail.breadcrumb.threadLibrary")}
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
        style={{
          height: contentHeight,
        }}>
        {sessions?.map((item, index) => (
          <Session
            key={index}
            session={item}
            isLastSession={index === sessions.length - 1}
            handleAskFollowing={(item) => handleAskFollowing(item)}
          />
        ))}
      </div>

      <div className="footer input-panel">
        {/* {messageStateStore?.pending && (
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
        )} */}

        <div className="session-input-box" ref={inputContainerRef}>
          <div className="session-inner-input-box">
            <ContentSelectorBtn
              btnType="text"
              handleChangeSelector={(searchTarget) =>
                setThreadSearchTarget(searchTarget)
              }
            />
            <ThreadSearchTargetSelector
              showText={false}
              searchTarget={threadSearchTarget}
              handleChangeSelector={(searchTarget) => {
                setThreadSearchTarget(searchTarget)

                // 非当前网页时，则清空内容
                if (searchTarget !== SearchTarget.CurrentPage) {
                  contentSelectorStore.resetState()
                }
              }}
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
              placeholder={getInputText()}
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
                  onClick={() => {
                    handleAskFollowing()
                  }}></Button>
              </div>
            </div>
          </div>
          {showSelectedWeblinkList ? (
            <SelectedWeblink
              closable={false}
              selectedWeblinkList={threadWeblinkListFilter?.map(
                (item, index) => ({ key: index, content: item }),
              )}
            />
          ) : null}
          {searchQuickActionStore.showQuickAction &&
          contentSelectorStore?.showSelectedMarks ? (
            <QuickAction />
          ) : null}
          {contentSelectorStore?.showSelectedMarks ? (
            <SelectedContentList
              marks={contentSelectorStore.marks}
              limitContainer
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
