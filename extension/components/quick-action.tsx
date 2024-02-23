import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Input,
  Menu,
  Modal,
  Popover,
  Skeleton,
  Space,
  Spin,
  Tooltip,
  Trigger,
  Typography
} from "@arco-design/web-react"
import {
  IconCheck,
  IconClockCircle,
  IconCopy,
  IconMessage,
  IconMinusCircle,
  IconPlus,
  IconPlusCircle,
  IconRefresh,
  IconStop
} from "@arco-design/web-react/icon"
import copyToClipboard from "copy-to-clipboard"
import React, { useRef, useState } from "react"
import Draggable from "react-draggable"

import {
  ACTION_TYPE,
  TASK_TYPE,
  type MessageState,
  type Mode,
  type QUICK_ACTION
} from "~/types"
import ArrowDownSVG from "~assets/common/arrow-down.svg"
import Logo from "~assets/logo.svg"
import AbstractSVG from "~assets/menu-icons/abstract.svg"
import CloseSVG from "~assets/menu-icons/close.svg"
import CodeSVG from "~assets/menu-icons/code.svg"
import CopySVG from "~assets/menu-icons/copy.svg"
import ExplainSVG from "~assets/menu-icons/explain.svg"
import ExtensionSVG from "~assets/menu-icons/extension.svg"
import GrammarySVG from "~assets/menu-icons/grammary.svg"
import QASVG from "~assets/menu-icons/qa.svg"
import RefreshSVG from "~assets/menu-icons/refresh.svg"
import SettingSVG from "~assets/menu-icons/setting.svg"
import TagHoverdSVG from "~assets/menu-icons/tag-hoverd.svg"
import TagSelectedSVG from "~assets/menu-icons/tag-selected.svg"
import TagSVG from "~assets/menu-icons/tag.svg"
import TranslateSVG from "~assets/menu-icons/translate.svg"
import WriteSVG from "~assets/menu-icons/write.svg"
// 自定义方法
import { useCountDown } from "~hooks/use-count-down"
import { errorMessage } from "~utils/message"
import { getPopupContainer } from "~utils/ui"

// 自定义组件
import { Markdown } from "./markdown"

const TextArea = Input.TextArea

export const modeList = [
  {
    id: "3",
    icon: ExplainSVG,
    text: "解释",
    prompt: `解释这个文本并说明其中使用的任何技术术语。`
  },
  {
    id: "6",
    icon: TranslateSVG,
    text: "翻译",
    prompt: `将这段文字翻译成中文。`
  },
  {
    id: "4",
    icon: AbstractSVG,
    text: "摘要",
    prompt: `用原文语言概括这段文字。`
  },
  {
    id: "8",
    icon: CodeSVG,
    text: "解释代码",
    prompt: `解释以下代码：
      \`\`\`
      $[text]
      \`\`\``
  },
  {
    id: "2",
    icon: WriteSVG,
    text: "重写",
    prompt: `重新表述这段文字。`
  },
  {
    id: "1",
    icon: QASVG,
    text: "问答",
    prompt: `回答这个问题。`
  },
  {
    id: "5",
    icon: GrammarySVG,
    text: "语法",
    prompt: `校对并纠正这段文字。`
  },

  {
    id: "7",
    icon: ExtensionSVG,
    text: "扩写",
    prompt: `详细说明这段文字。`
  }
]

const markdown = `
  
  
  # Refly
  
  [Refly](https://refly.ai)
  
  - Refly
  - fly
  
  Refly must fly!
  
  \`\`\`js
  const foo = 42
  \`\`\`
  
  `
const getModePrompt = (modeId: string) => {
  return modeList.filter((item) => (item.id = modeId))?.[0]?.prompt
}

type IconTipPosition =
  | "top"
  | "br"
  | "rt"
  | "tr"
  | "tl"
  | "bottom"
  | "bl"
  | "left"
  | "lt"
  | "lb"
  | "right"
  | "rb"

const IconTip = ({
  text,
  children,
  position = "top"
}: {
  text: string
  children: any
  position?: IconTipPosition
}) => (
  <Tooltip
    mini
    position={position}
    content={text}
    getPopupContainer={getPopupContainer}>
    {children}
  </Tooltip>
)

const PinnedActionBtn = (props: {
  quickAction: Mode
  handleBarFuncClick: (mode: Mode) => void
  showIcon: boolean
}) => {
  const { quickAction, handleBarFuncClick, showIcon = true } = props
  return (
    <IconTip text={quickAction.text}>
      <div
        className="action-btn"
        onClick={() => handleBarFuncClick(quickAction)}>
        <img src={quickAction.icon} alt={quickAction.text} />
        {showIcon && <span>{quickAction.text}</span>}
      </div>
    </IconTip>
  )
}

type QuickActionProps = {
  currentMode: Mode
  defaultMode: Mode
  setCurrentMode: (mode: Mode) => void
  handleMenuItemClick: (mode: Mode) => void
  handleChangeDefaultMode: (mode: Mode) => void

  popupVisible: boolean
  setPopupVisible: (popupVisible: boolean) => void

  selectedText: string
  handleInputChange: (value: string) => void
  messageState: MessageState

  handleQuickActionGenResponse: (
    taskType: TASK_TYPE,
    data: QUICK_ACTION
  ) => void

  isShowSide: boolean
  setIsShowSide: (isShowSide: boolean) => void
  barPosition: { top?: number; left?: number }

  handleBarFuncClick: (mode: Mode) => void
  continueChatFromQuickAction: () => void
  quickActionToolbarVisible: boolean
  setQuickActionToolbarVisible: (val: boolean) => void
  handleShutdownGenReponseTask: () => void
}

const QuickAction = (props: QuickActionProps) => {
  const [isAnswerCopyCountdown, setIsAnswerCopyCountdown] = useCountDown(3)
  const {
    currentMode,
    setCurrentMode,
    defaultMode,
    handleMenuItemClick,
    handleChangeDefaultMode,
    popupVisible,
    setPopupVisible,
    selectedText,
    handleInputChange,
    messageState,
    handleQuickActionGenResponse,
    quickActionToolbarVisible,
    setQuickActionToolbarVisible,
    isShowSide,
    setIsShowSide,
    barPosition,
    handleBarFuncClick,
    continueChatFromQuickAction,
    handleShutdownGenReponseTask
  } = props

  const ModeItem = (mode: Mode) => (
    <Menu.Item key={mode?.text}>
      <div className="item">
        <div
          className="label-wrapper"
          onClick={() => handleMenuItemClick(mode)}>
          <img
            src={mode?.icon}
            alt={mode?.text}
            style={{ width: 16, height: 16 }}
          />
          <span className="label">{mode?.text}</span>
        </div>
        {/* <img
          src={mode?.text === defaultMode.text ? TagSelectedSVG : TagSVG}
          alt="置顶"
          onMouseEnter={(e) =>
            ((e.target as any).src =
              mode?.text === defaultMode.text ? TagSelectedSVG : TagHoverdSVG)
          }
          onMouseLeave={(e) =>
            ((e.target as any).src =
              mode?.text === defaultMode.text ? TagSelectedSVG : TagSVG)
          }
          onClick={() => handleChangeDefaultMode(mode)}
        /> */}
      </div>
    </Menu.Item>
  )
  const ModeItems = (
    <div className="user-prompt">
      <div className="header">
        <span className="title">快捷操作</span>
        <span className="control">
          <IconPlusCircle style={{ fontSize: 18 }} />
        </span>
      </div>
      <div className="content">
        <Menu className="prompt-menu">{modeList.map((e) => ModeItem(e))}</Menu>
      </div>
      {/* <div className="footer"></div> */}
    </div>
  )

  const ModeTagItem = (mode: Mode) => (
    <div
      className={
        mode?.text === currentMode.text
          ? "menu-tag-item active"
          : "menu-tag-item"
      }
      key={mode?.text}
      onClick={(_) => {
        handleQuickActionGenResponse(TASK_TYPE.QUICK_ACTION, {
          actionType: ACTION_TYPE.SELECTION,
          actionPrompt: mode.prompt,
          reference: selectedText
        })
        setCurrentMode(mode)
      }}>
      <span>{mode?.text}</span>
    </div>
  )
  const ModeTagItems = modeList.map((e) => ModeTagItem(e))

  const popupContent = (
    <div className="popup-content">
      <header>
        <div className="header-left">
          <img src={Logo} alt="Refly" style={{ width: 24, height: 24 }} />
          <span className="text-color">{currentMode.text}</span>
          {/* <img src={SettingSVG} alt="设置" /> */}
        </div>
        <div className="header-right">
          <img
            src={CloseSVG}
            alt="关闭"
            onClick={(_) => setPopupVisible(false)}
          />
        </div>
      </header>

      <div className="funcs">{ModeTagItems}</div>

      <div className="input">
        <TextArea
          autoSize={{ maxRows: 5 }}
          defaultValue={selectedText}
          onChange={handleInputChange}
          style={{ borderRadius: 8, resize: "none" }}
        />
      </div>

      <div className="output">
        <div className="output-bar">
          <div className="result">
            <span className="text-color text">结果</span>
            {messageState.taskType === TASK_TYPE.QUICK_ACTION &&
              messageState?.pending && <Spin size={14} className="loading" />}
          </div>
          <div>
            {messageState.taskType === TASK_TYPE.QUICK_ACTION &&
            messageState?.pending ? (
              <span
                className="stop-action"
                onClick={handleShutdownGenReponseTask}>
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
                        copyToClipboard(messageState?.pendingMsg)
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
                      handleQuickActionGenResponse(TASK_TYPE.QUICK_ACTION, {
                        actionType: ACTION_TYPE.SELECTION,
                        actionPrompt: currentMode?.prompt,
                        reference: selectedText
                      })
                    }
                  />
                </IconTip>
              </>
            )}
          </div>
        </div>
        <div className="ouput-result">
          <Markdown content={messageState?.pendingMsg} />
        </div>
      </div>

      {!messageState.pending &&
        !messageState.error &&
        messageState.taskType === TASK_TYPE.QUICK_ACTION && (
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
      {!messageState.pending &&
        messageState.error &&
        messageState.taskType === TASK_TYPE.QUICK_ACTION && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <div className="footer">
              <Typography.Text type="error">{errorMessage}</Typography.Text>
            </div>
          </>
        )}
    </div>
  )

  const pinnedActionBtnList = modeList.slice(0, 3)
  const showIcon = pinnedActionBtnList.length <= 3

  // trigger="click"
  //       popupVisible={popupVisible}
  //       style={{ maxWidth: 600 }}
  //       content={popupContent}
  //       getPopupContainer={getPopupContainer}

  return (
    <div className="float-quick-action-btn-wrapper" style={barPosition}>
      <Trigger
        trigger="click"
        position="bottom"
        popup={() => (
          <Draggable handle=".header-left">{popupContent}</Draggable>
        )}
        popupAlign={{
          bottom: 12,
          top: 12
        }}
        popupVisible={popupVisible}
        getPopupContainer={getPopupContainer}
        style={{ maxWidth: 600 }}>
        <div className="float-quick-action-btn">
          <div className="inner">
            <div className="action-btn-wrapper">
              <span
                className="logo-btn"
                onClick={() => setIsShowSide(!isShowSide)}>
                <img src={Logo} alt="Refly" />
              </span>
              <div className="action-btn-box">
                {pinnedActionBtnList.map((quickAction, index) => (
                  <PinnedActionBtn
                    key={index}
                    handleBarFuncClick={handleBarFuncClick}
                    quickAction={quickAction}
                    showIcon={showIcon}
                  />
                ))}
              </div>
            </div>
            <Dropdown
              position="br"
              unmountOnExit={false}
              droplist={ModeItems}
              getPopupContainer={getPopupContainer}>
              <div className="more">
                <img src={ArrowDownSVG} alt="更多" />
              </div>
            </Dropdown>
          </div>
        </div>
      </Trigger>
    </div>
  )
}

export default QuickAction
