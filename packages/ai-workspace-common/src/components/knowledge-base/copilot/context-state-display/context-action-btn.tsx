import { Badge, Button, Tooltip } from '@arco-design/web-react';
import { IconFontColors } from '@arco-design/web-react/icon';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';

export const ContextActionBtn = () => {
  const { enableMultiSelect, currentSelectedContentList, currentSelectedText, setShowContextCard, showContextCard } =
    useKnowledgeBaseStore();
  const count = enableMultiSelect ? currentSelectedContentList.length : currentSelectedText ? 1 : 0;

  return (
    <Badge
      count={count}
      dotStyle={{ backgroundColor: '#00968F', fontSize: 8, fontWeight: 'bold' }}
      onClick={() => {
        setShowContextCard(!showContextCard);
      }}
    >
      <Tooltip content="选中内容">
        <Button icon={<IconFontColors />} type="text" className="chat-input-assist-action-item"></Button>
      </Tooltip>
    </Badge>
  );
};
