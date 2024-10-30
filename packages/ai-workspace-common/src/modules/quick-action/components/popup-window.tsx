import { Button, Divider, Input, Select, Spin, Typography } from '@arco-design/web-react';
import { IconCheck, IconClose, IconCopy, IconMessage, IconMinusCircle, IconRefresh } from '@arco-design/web-react/icon';
import { type CustomPrompt } from '../types/custom-prompt';
import copyToClipboard from 'copy-to-clipboard';
import React, { type FC, useEffect, useState } from 'react';
import Draggable from 'react-draggable';

import Logo from '../../../assets/logo.svg';
import { Markdown } from '../../../components/markdown';
import { useCountDown } from '../hooks/use-countdown';
import { useQuickActionStore } from '../stores/quick-action';
import { CopilotOperationModule } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

const TextArea = Input.TextArea;
const Option = Select.Option;

interface PopupWindowProps {
  customPromptList: CustomPrompt[];
  getPopupContainer: (node: HTMLElement) => Element;
}

/**
 *  快捷指令弹窗
 * @param props
 * @returns
 */
const PopupWindow: FC<PopupWindowProps> = (props) => {
  const { customPromptList, getPopupContainer } = props;

  const [isAnswerCopyCountdown, setIsAnswerCopyCountdown] = useCountDown(3);
  const [quickActionResp, setQuickActionResp] = useState('');

  // 状态管理 - 方法
  // const conversationStore = useConversationStore((state) => ({
  //   updateMessages: state.updateMessages,
  //   messages: state.messages,
  //   nowConversation: state.nowConversation
  // }))

  // 状态管理 - Message State
  // const taskStoreState = useTaskStore((state) => ({
  //   pendingMsg: state?.pendingMsg
  // }))
  // const shutdownGenReponse = useTaskStore((state) => state.shutdownGenReponse)
  // const messageState = useTaskStore((state) => ({
  //   taskType: state.taskType,
  //   pendingMsg: state.pendingMsg,
  //   pending: state.pending,
  //   error: state.error
  // }))

  // 状态管理 - UI State
  const quickActionStore = useQuickActionStore();

  return (
    <Draggable handle=".header-left">
      <div className="popup-content">
        <header>
          <div className="header-left"></div>
          <div className="header-right">
            <Button
              type="text"
              icon={<IconClose />}
              onClick={() => {
                quickActionStore.updateUIState({ popupVisible: false });
              }}
            />
          </div>
        </header>

        <CopilotOperationModule source={MessageIntentSource.ResourceQuickAction} />
      </div>
    </Draggable>
  );
};

export default PopupWindow;
