import React from 'react';
import './index.scss';
import { BaseSearchAndSelector } from '../base-search-and-selector';
import classNames from 'classnames';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

interface CustomProps {
  showList?: boolean;
  onClickOutside?: () => void;
  onSearchValueChange?: (value: string) => void;
  onSelect?: (item: CanvasNode) => void;
  selectedItems: CanvasNode[];
  onClose?: () => void;
}

export interface BaseMarkContextSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    CustomProps {}

export const BaseMarkContextSelector = (props: BaseMarkContextSelectorProps) => {
  const { onClickOutside, onSearchValueChange, onClose, onSelect, selectedItems, ...divProps } = props;

  return (
    <div {...divProps} className={classNames('refly-base-context-selector', divProps?.className)}>
      <BaseSearchAndSelector
        onSelect={(item) => {
          onSelect?.(item);
        }}
        onClose={onClose}
        showList={true}
        selectedItems={selectedItems}
      />
    </div>
  );
};
