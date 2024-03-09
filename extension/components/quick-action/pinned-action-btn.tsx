import {
  TASK_TYPE,
  type Mode,
  ACTION_TYPE,
  type QUICK_ACTION,
} from "~/types"
import { IconTip } from '../home/icon-tip'
import { usePopupStore } from '../../stores/popup'
import { useQuickActionStore } from '../../stores/quick-action'

export const PinnedActionBtn = (props: {
  quickAction: Mode
  handleQuickActionGenResponse: (taskType: TASK_TYPE,
    data: QUICK_ACTION) => void
  showIcon: boolean
}) => {
  const { quickAction, showIcon = true, handleQuickActionGenResponse } = props
  const quickActionStore = useQuickActionStore();
  const popupStore = usePopupStore();

  const handleBarFuncClick = (mode: Mode) => {
    quickActionStore.setCurrentMode(mode);
    popupStore.setPopupVisible(true);

    // handleGenResponse(QuestionType.QuickAction, selectedTextRef.current, mode)
    handleQuickActionGenResponse(TASK_TYPE.QUICK_ACTION, {
      actionType: ACTION_TYPE.SELECTION,
      actionPrompt: mode?.prompt,
      reference: quickActionStore.selectedText
    })
  }

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