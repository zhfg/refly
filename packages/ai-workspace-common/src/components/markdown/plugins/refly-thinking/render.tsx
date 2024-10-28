import { memo } from 'react';
import { Button } from 'antd';

import { CANVAS_THINKING_TAG } from '@refly-packages/ai-workspace-common/constants/canvas';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { chatSelectors } from '@refly-packages/ai-workspace-common/stores/chat/selectors';

export const isReflyThinkingClosed = (input: string = '') => {
  const openTag = `<${CANVAS_THINKING_TAG}>`;
  const closeTag = `</${CANVAS_THINKING_TAG}>`;

  return input.includes(openTag) && input.includes(closeTag);
};

const Render = memo((props: { children: React.ReactNode; id: string }) => {
  const { children, id } = props;

  const [isThinking] = useChatStoreShallow((state) => {
    const message = chatSelectors.getMessageById(id)(state);

    return [!isReflyThinkingClosed(message?.content)];
  });

  return (
    isThinking && (
      <div>
        <Button loading={isThinking}>Thinking to operate canvas...</Button>
      </div>
    )
  );
});

export default Render;
