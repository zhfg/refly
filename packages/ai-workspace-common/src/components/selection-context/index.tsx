import React from 'react';
import { Button } from 'antd';
import { IconPlus } from '@arco-design/web-react/icon';
import { useSelectionContext } from '../../hooks/use-selection-context';
import { SelectedTextDomain } from '@refly/common-types';
import { SelectionBubble } from '@refly-packages/ai-workspace-common/components/selection-bubble';
import { useTranslation } from 'react-i18next';
import { CanvasNodeData } from '@refly/openapi-schema';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

interface SelectionContextProps {
  containerClass?: string;
  getNodeData: (text: string) => CanvasNode;
}

export const SelectionContext: React.FC<SelectionContextProps> = ({ containerClass, getNodeData }) => {
  const { t } = useTranslation();
  const { selectedText, isSelecting, addToContext } = useSelectionContext({
    containerClass,
  });

  const handleAddToContext = (text: string) => {
    // Create a mark object
    const node: CanvasNode = getNodeData(text);

    addToContext(node);
  };

  return (
    <SelectionBubble containerClass={containerClass} placement="top" offset={[0, 10]}>
      <div
        className="refly-selector-hover-menu"
        style={{
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderRadius: '4px',
          padding: '2px 4px',
        }}
        onClick={() => handleAddToContext(selectedText)}
      >
        <Button type="text" size="small">
          <span className="font-medium">{t('knowledgeBase.context.addToContext')}</span>
        </Button>
      </div>
    </SelectionBubble>
  );
};
