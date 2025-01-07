import React, { useCallback } from 'react';
import { Button, message } from 'antd';
import { SelectionBubble } from './selection-bubble';
import { useTranslation } from 'react-i18next';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useSelectionContext } from './use-selection-context';
import { MessageSquareDiff } from 'lucide-react';
import { IconMemo } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useCreateMemo } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-memo';

interface SelectionContextProps {
  containerClass?: string;
  getNodeData: (text: string) => CanvasNode;
}

export const SelectionContext: React.FC<SelectionContextProps> = ({ containerClass, getNodeData }) => {
  const { t } = useTranslation();
  const { selectedText, isSelecting, addToContext, removeSelection } = useSelectionContext({
    containerClass,
  });

  const { createMemo } = useCreateMemo();
  const handleCreateMemo = useCallback(
    (selectedText: string) => {
      createMemo({
        content: selectedText,
      });
      removeSelection();
    },
    [selectedText, createMemo],
  );

  const handleAddToContext = useCallback(
    (text: string) => {
      // Create a mark object
      const node: CanvasNode = getNodeData(text);
      addToContext(node);
      message.success(t('knowledgeBase.context.addToContextSuccess'));
    },
    [getNodeData, addToContext, t],
  );

  const buttons = [
    {
      className: 'w-full font-medium text-xs justify-start !text-[#00968F] hover:!text-[#00968F]/80',
      icon: <MessageSquareDiff size={12} />,
      label: t('knowledgeBase.context.addToContext'),
      onClick: () => handleAddToContext(selectedText),
    },
    {
      className: 'w-full font-medium text-xs justify-start',
      icon: <IconMemo size={12} />,
      label: t('knowledgeBase.context.createMemo'),
      onClick: () => handleCreateMemo(selectedText),
    },
  ];

  return (
    <SelectionBubble containerClass={containerClass} placement="top" offset={[0, 10]}>
      <div
        className="refly-selector-hover-menu flex flex-col"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.10)',
          boxShadow: '0 2px 6px 0 rgba(0,0,0,0.10)',
          borderRadius: '8px',
          padding: '2px 4px',
        }}
      >
        {buttons.map((button, index) => (
          <Button
            type="text"
            size="small"
            key={index}
            className={button.className}
            icon={button.icon}
            onMouseDown={(e) => {
              // Prevent selection from being cleared
              e.preventDefault();
              e.stopPropagation();
              button.onClick();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {button.label}
          </Button>
        ))}
      </div>
    </SelectionBubble>
  );
};
