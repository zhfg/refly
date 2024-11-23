import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import './index.scss';

import { Command } from 'cmdk';

import './index.scss';
import { Home } from './home';

// request
import { RenderItem } from './type';
import classNames from 'classnames';

import { useTranslation } from 'react-i18next';
import { BaseMarkType, Mark } from '@refly/common-types';
import { getNodeIcon, getTypeIcon } from '../../utils/icon';

import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { IconRefresh } from '@arco-design/web-react/icon';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { CanvasNodeType } from '@refly/openapi-schema';

interface CustomProps {
  showList?: boolean;
  onClickOutside?: () => void;
  onSearchValueChange?: (value: string) => void;
  onSelect?: (node: CanvasNode) => void;
  onClose?: () => void;
  source: MessageIntentSource;
}

export interface BaseSearchAndSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    CustomProps {
  selectedItems: CanvasNode[];
}

export const BaseSearchAndSelector = ({
  onClose,
  onSelect,
  showList,
  onClickOutside,
  onSearchValueChange,
  selectedItems = [],
}: BaseSearchAndSelectorProps) => {
  const [activeTab, setActiveTab] = useState<BaseMarkType | 'all'>('all');
  const [searchValue, setSearchValue] = useState('');
  const [activeValue, setActiveValue] = React.useState('');
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const { t } = useTranslation();

  const [displayMode, setDisplayMode] = useState<'list' | 'search'>('list');

  const contextPanelStore = useContextPanelStoreShallow((state) => ({
    resetSelectedTextCardState: state.resetSelectedTextCardState,
  }));
  const { handleReset } = useSelectedMark();
  // hooks

  const isHome = activeTab === 'all';

  const handleSearchValueChange = (val: string) => {
    if (onSearchValueChange) {
      onSearchValueChange(val);
    }
    setSearchValue(val);
  };

  useEffect(() => {
    inputRef?.current?.focus();
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      // Click was outside the component
      if (ref.current && !ref.current.contains(event.target) && onClickOutside) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { nodes } = useCanvasControl();
  console.log('nodes', nodes);
  console.log('selectedItems', selectedItems);
  const sortedNodes: CanvasNode[] = [
    ...((selectedItems || []).map((item) => ({ ...item, isSelected: true })) || []),
    ...(nodes?.filter((item) => !selectedItems.some((selected) => selected.id === item.id)) || []),
  ];
  const sortedRenderData: RenderItem[] = sortedNodes.map((item) => ({
    data: item,
    type: item.type,
    icon: getNodeIcon(item.type, { width: 12, height: 12 }),
    onItemClick: (item: CanvasNode) => {
      onSelect(item);
    },
  }));

  return (
    <Command
      value={activeValue}
      onValueChange={setActiveValue}
      ref={ref}
      filter={() => 1}
      className={classNames(showList ? 'search-active' : '')}
      onCompositionStart={(e) => console.log('composition start')}
      onCompositionUpdate={(e) => console.log('composition update')}
      onCompositionEnd={(e) => console.log('composition end')}
      onKeyDownCapture={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isComposing) {
          console.log('keydown', searchValue);
        }

        if (isHome || searchValue.length) {
          return;
        }
      }}
    >
      <div cmdk-input-wrapper="">
        <Command.Input
          autoFocus
          ref={inputRef}
          value={searchValue}
          placeholder={t('canvas.contextSelector.placeholder')}
          onCompositionStart={(e) => {
            setIsComposing(true);
          }}
          onCompositionUpdate={(e) => console.log('composition update')}
          onCompositionEnd={(e) => {
            setIsComposing(false);
          }}
          onValueChange={handleSearchValueChange}
        />
      </div>
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Home
          showItemDetail={false}
          key={'search'}
          displayMode={displayMode}
          data={sortedRenderData}
          activeValue={activeValue}
          setValue={setActiveValue}
          searchValue={searchValue}
        />
      </Command.List>
      <div cmdk-footer="">
        <div className="cmdk-footer-inner">
          <div className="cmdk-footer-hint">
            <div cmdk-vercel-shortcuts="">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> {t('knowledgeBase.context.popoverSelector.footer.navigate')}
              </span>
              <span>
                <kbd>↵</kbd> {t('knowledgeBase.context.popoverSelector.footer.toggle')}
              </span>
            </div>
          </div>
          <div className="cmdk-footer-action">
            <Button
              size="small"
              icon={<IconRefresh />}
              onClick={() => {
                contextPanelStore.resetSelectedTextCardState();
                handleReset();
              }}
            >
              {t('knowledgeBase.context.clearContext')}
            </Button>
          </div>
        </div>
      </div>
    </Command>
  );
};
