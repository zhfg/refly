import {
  Trigger,
} from "@arco-design/web-react"
import React from "react"
import Draggable from "react-draggable"

import {
  TASK_TYPE,
  type QUICK_ACTION
} from "~/types"
import Logo from "~assets/logo.svg"

// hooks
import { useBuildTask } from "~hooks/use-build-task"

// stores
import { usePopupStore } from '../../stores/popup'
import { useSiderStore } from '../../stores/sider'
import { useQuickActionStore } from '../../stores/quick-action'

// 自定义方法
import { getPopupContainer } from "~utils/ui"
import { modeList } from './utils'

// 自定义组件
import { DropdownMenu } from './dropdown-menu';
import { PopupContent } from './popup-content';
import { PinnedActionBtn } from './pinned-action-btn'

type QuickActionProps = {
}

const QuickAction = (props: QuickActionProps) => {
  const quickActionStore = useQuickActionStore();
  const popupStore = usePopupStore();
  const siderStore = useSiderStore();
  const { buildQuickActionTaskAndGenReponse, buildGenTitleTaskAndGenResponse, buildShutdownTaskAndGenResponse } = useBuildTask();

  const handleQuickActionGenResponse = (
    taskType: TASK_TYPE,
    data: QUICK_ACTION
  ) => {
    let postProcessedData = data
    if (data?.actionPrompt === modeList[3].prompt) {
      postProcessedData.actionPrompt = postProcessedData.actionPrompt.replace(
        "$[text]",
        data.reference
      )
      postProcessedData.reference = ""
    }
    buildQuickActionTaskAndGenReponse(taskType, postProcessedData)
  }

  const pinnedActionBtnList = modeList.slice(0, 3)
  const showIcon = pinnedActionBtnList.length <= 3

  // trigger="click"
  //       popupVisible={popupVisible}
  //       style={{ maxWidth: 600 }}
  //       content={popupContent}
  //       getPopupContainer={getPopupContainer}

  return (
    <div className="float-quick-action-btn-wrapper" style={quickActionStore.barPosition}>
      <Trigger
        trigger="click"
        position="bottom"
        popup={() => (
          <Draggable handle=".header-left"><PopupContent handleQuickActionGenResponse={handleQuickActionGenResponse} /></Draggable>
        )}
        popupAlign={{
          bottom: 12,
          top: 12
        }}
        popupVisible={popupStore?.popupVisible}
        getPopupContainer={getPopupContainer}
        style={{ maxWidth: 600 }}>
        <div className="float-quick-action-btn">
          <div className="inner">
            <div className="action-btn-wrapper">
              <span
                className="logo-btn"
                onClick={() => siderStore.setShowSider(!siderStore.showSider)}>
                <img src={Logo} alt="Refly" />
              </span>
              <div className="action-btn-box">
                {pinnedActionBtnList.map((quickAction, index) => (
                  <PinnedActionBtn
                    key={index}
                    handleQuickActionGenResponse={handleQuickActionGenResponse}
                    quickAction={quickAction}
                    showIcon={showIcon}
                  />
                ))}
              </div>
            </div>
            <DropdownMenu handleQuickActionGenResponse={handleQuickActionGenResponse} />
          </div>
        </div>
      </Trigger>
    </div>
  )
}

export default QuickAction
