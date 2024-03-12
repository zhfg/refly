import React, { useCallback } from "react"
import {
  QUICK_ACTION_TYPE,
  TASK_TYPE,
  type Mode,
  type QUICK_ACTION_TASK_PAYLOAD,
} from "~types"
import { Dropdown, Menu } from "@arco-design/web-react"
import { IconPlusCircle } from "@arco-design/web-react/icon"
import { modeList } from "./utils"
import ArrowDownSVG from "~assets/common/arrow-down.svg"
import { getPopupContainer } from "~utils/ui"
// stores
import { usePopupStore } from "../../stores/popup"
import { useQuickActionStore } from "../../stores/quick-action"

interface DropdownMenuProps {
  handleQuickActionGenResponse: (
    taskType: TASK_TYPE,
    data: QUICK_ACTION_TASK_PAYLOAD,
  ) => void
}

export const DropdownMenu = (props: DropdownMenuProps) => {
  const quickActionStore = useQuickActionStore()
  const popupStore = usePopupStore()

  const handleChangeDefaultMode = (mode: Mode) => {
    quickActionStore.setDefaultMode(mode)
  }

  const handleMenuItemClick = useCallback(
    (mode: Mode) => {
      quickActionStore.setCurrentMode(mode)
      popupStore.setPopupVisible(true)

      // handleGenResponse(QuestionType.QuickAction, selectedTextRef.current, mode)
      props.handleQuickActionGenResponse(TASK_TYPE.QUICK_ACTION, {
        actionType: QUICK_ACTION_TYPE.SELECTION,
        actionPrompt: mode?.prompt,
        reference: quickActionStore.selectedText,
      })
    },
    [quickActionStore.selectedText],
  )

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

  return (
    <Dropdown
      position="br"
      unmountOnExit={false}
      droplist={ModeItems}
      getPopupContainer={getPopupContainer}>
      <div className="more">
        <img src={ArrowDownSVG} alt="更多" />
      </div>
    </Dropdown>
  )
}
