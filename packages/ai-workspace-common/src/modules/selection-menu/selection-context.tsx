import React, { useCallback } from 'react';
import { Button, message } from 'antd';
import { SelectionBubble } from './selection-bubble';
import { useTranslation } from 'react-i18next';
import { useSelectionContext } from './use-selection-context';
import { MessageSquareDiff } from 'lucide-react';
import { IconMemo, IconQuote } from '@refly-packages/ai-workspace-common/components/common/icon';
import { useCreateMemo } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-memo';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

interface SelectionContextProps {
  containerClass?: string;
  getContextItem: (text: string) => IContextItem;
}

export const SelectionContext: React.FC<SelectionContextProps> = ({ containerClass, getContextItem }) => {
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
      const item = getContextItem(text);
      addToContext(item);
      message.success(t('knowledgeBase.context.addToContextSuccess'));
    },
    [getContextItem, addToContext, t],
  );

  const buttons = [
    {
      className: 'w-full px-2 py-0 font-medium text-sm justify-start !text-[#00968F] hover:!text-[#00968F]/80',
      icon: <IconQuote size={14} />,
      label: t('knowledgeBase.context.addToContext'),
      onClick: () => handleAddToContext(selectedText),
    },
    {
      className: 'w-full px-2 py-0 text-sm justify-start',
      icon: <IconMemo size={14} />,
      label: t('knowledgeBase.context.createMemo'),
      onClick: () => handleCreateMemo(selectedText),
    },
  ];

  return (
    <SelectionBubble containerClass={containerClass} placement="top" offset={[0, 10]}>
      <div className="refly-selector-hover-menu flex flex-col bg-white border border-solid border-gray-200 shadow-lg rounded-lg px-1 py-1">
        {buttons.map((button) => (
          <Button
            type="text"
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
