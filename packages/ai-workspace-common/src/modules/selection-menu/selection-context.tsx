import React, { useCallback } from 'react';
import { Button, message } from 'antd';
import { SelectionBubble } from './selection-bubble';
import { useTranslation } from 'react-i18next';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useSelectionContext } from './use-selection-context';
import { MessageSquareDiff } from 'lucide-react';

interface SelectionContextProps {
  containerClass?: string;
  getNodeData: (text: string) => CanvasNode;
}

export const SelectionContext: React.FC<SelectionContextProps> = ({ containerClass, getNodeData }) => {
  const { t } = useTranslation();
  const { selectedText, isSelecting, addToContext } = useSelectionContext({
    containerClass,
  });

  const handleAddToContext = useCallback(
    (text: string) => {
      // Create a mark object
      const node: CanvasNode = getNodeData(text);
      addToContext(node);
      message.success(t('knowledgeBase.context.addToContextSuccess'));
    },
    [getNodeData, addToContext, t],
  );

  return (
    <SelectionBubble containerClass={containerClass} placement="top" offset={[0, 10]}>
      <div
        className="refly-selector-hover-menu"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.10)',
          boxShadow: '0 2px 6px 0 rgba(0,0,0,0.10)',
          borderRadius: '8px',
          padding: '2px 4px',
        }}
      >
        <Button
          type="text"
          size="small"
          className="text-[#00968F] hover:text-[#00968F]/80"
          icon={<MessageSquareDiff size={12} className="text-[#00968F]" />}
          onMouseDown={(e) => {
            // Prevent selection from being cleared
            e.preventDefault();
            e.stopPropagation();
            handleAddToContext(selectedText);
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // handleAddToContext(selectedText);
          }}
        >
          <span className="font-medium text-xs text-[#00968F]">{t('knowledgeBase.context.addToContext')}</span>
        </Button>
      </div>
    </SelectionBubble>
  );
};
