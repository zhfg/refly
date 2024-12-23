import { Button, Badge, Divider } from 'antd';
import { HiOutlineDocumentAdd } from 'react-icons/hi';
import { HiOutlineBars2 } from 'react-icons/hi2';
import { RiUploadCloud2Line } from 'react-icons/ri';
import { PiShootingStar } from 'react-icons/pi';
import { MdOutlineAutoAwesomeMotion } from 'react-icons/md';

import { useTranslation } from 'react-i18next';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';

import { useImportResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { CanvasNodeType, SearchDomain } from '@refly/openapi-schema';
import { ContextItem } from '@refly-packages/ai-workspace-common/types/context';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { ImportResourceModal } from '@refly-packages/ai-workspace-common/components/import-resource';
import { SourceListModal } from '@refly-packages/ai-workspace-common/components/source-list/source-list-modal';
import { useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { IconCanvas, IconDocument, IconResource } from '@refly-packages/ai-workspace-common/components/common/icon';
import TooltipWrapper from '@refly-packages/ai-workspace-common/components/common/tooltip-button';
import { useCanvasStoreShallow } from '@refly-packages/ai-workspace-common/stores/canvas';
import { IoAnalyticsOutline } from 'react-icons/io5';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/use-create-document';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useReactFlow } from '@xyflow/react';

// Define toolbar item interface
interface ToolbarItem {
  type: 'button' | 'popover' | 'divider';
  icon?: React.ElementType;
  key?: string;
  domain?: string;
}

interface MenuPopperProps {
  open: boolean;
  position: { x: number; y: number };
  setOpen: (open: boolean) => void;
}

export const MenuPopper: FC<MenuPopperProps> = ({ open, position, setOpen }) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState<number>(0);
  const { createSingleDocumentInCanvas, isCreating: isCreatingDocument } = useCreateDocument();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const { addNode } = useCanvasControl();

  const { importResourceModalVisible, setImportResourceModalVisible } = useImportResourceStoreShallow((state) => ({
    importResourceModalVisible: state.importResourceModalVisible,
    setImportResourceModalVisible: state.setImportResourceModalVisible,
  }));

  const menuItems: ToolbarItem[] = [
    { key: 'askAI', icon: PiShootingStar, type: 'button' },
    { type: 'divider' },
    { key: 'createDocument', icon: HiOutlineDocumentAdd, type: 'button' },
    { key: 'createMemo', icon: MdOutlineAutoAwesomeMotion, type: 'button' },
    { key: 'addResource', icon: IconResource, type: 'popover', domain: 'resource' },
    { key: 'addDocument', icon: IconDocument, type: 'popover', domain: 'document' },
    { key: 'addMemo', icon: MdOutlineAutoAwesomeMotion, type: 'button' },
    { key: 'addHighlight', icon: HiOutlineBars2, type: 'button' },
    { type: 'divider' },
    { key: 'importResource', icon: RiUploadCloud2Line, type: 'button' },
  ];

  const handleConfirm = (selectedItems: ContextItem[]) => {
    if (selectedItems.length > 0) {
      const domain = selectedItems[0]?.domain;
      console.log('selectedItems', selectedItems);
      selectedItems.forEach((item) => {
        const contentPreview = item?.snippets?.map((snippet) => snippet?.text || '').join('\n');
        addNode({
          type: domain as CanvasNodeType,
          data: { title: item.title, entityId: item.id, contentPreview: item?.contentPreview || contentPreview },
        });
      });
    }
  };

  const adjustPosition = (x: number, y: number) => {
    const menuWidth = 200;
    const padding = 10;

    // Get window dimensions
    const windowWidth = window?.innerWidth ?? 0;
    const windowHeight = window?.innerHeight ?? 0;

    // Adjust X position if menu would overflow right side
    const adjustedX = Math.min(x, windowWidth - menuWidth - padding);

    // Use actual menu height for calculations
    const adjustedY = Math.min(y, windowHeight - menuHeight - padding);

    return {
      x: Math.max(padding, adjustedX),
      y: Math.max(padding, adjustedY),
    };
  };

  const getMenuScreenPosition = () => {
    const reactFlowInstance = useReactFlow();
    // 将画布坐标转回屏幕坐标
    const screenPosition = reactFlowInstance.flowToScreenPosition(position);
    return adjustPosition(screenPosition.x, screenPosition.y);
  };

  const menuScreenPosition = getMenuScreenPosition();

  const handleMenuClick = async ({ key }: { key: string }) => {
    setActiveKey(key);
    switch (key) {
      case 'askAI':
        break;
      case 'createDocument':
        await createSingleDocumentInCanvas(position);
        setOpen(false);
        break;
      case 'createMemo':
        break;
      case 'addResource':
        break;
      case 'addDocument':
        break;
      case 'addMemo':
        break;
      case 'addHighlight':
        break;
      case 'importResource':
        setImportResourceModalVisible(true);
        setOpen(false);
        break;
    }
  };

  const getIsLoading = (tool: string) => {
    if (tool === 'createDocument' && isCreatingDocument) {
      return true;
    }
    return false;
  };

  const MenuItem = ({ item, key }: { item: ToolbarItem; key: string }) => {
    return (
      <div key={key} className="flex items-center w-full">
        <Button
          loading={getIsLoading(item.key)}
          className={`w-full px-2 justify-start ${activeKey === item.key ? 'bg-gray-100' : ''}`}
          type="text"
          icon={<item.icon className="flex items-center" />}
          onClick={() => handleMenuClick({ key: item.key })}
        >
          <span>{t(`canvas.toolbar.${item.key}`)}</span>
        </Button>
      </div>
    );
  };

  // Update menu height when menu opens or content changes
  useEffect(() => {
    if (open && menuRef.current) {
      setMenuHeight(menuRef.current.offsetHeight);
    }
  }, [open, menuItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      console.log('target', target);
      if (open && !target.closest('.menu-popper')) {
        setOpen(false);
      }
    };

    if (open) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      setActiveKey(null);
    };
  }, [open]);

  return (
    open && (
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-lg p-2 w-[200px] menu-popper"
        style={{
          left: `${menuScreenPosition.x}px`,
          top: `${menuScreenPosition.y}px`,
        }}
      >
        {menuItems.map((item) => {
          if (item.type === 'button') {
            return (
              <div key={item.key} className="flex items-center w-full">
                <Button
                  loading={getIsLoading(item.key)}
                  className={`w-full px-2 justify-start ${activeKey === item.key ? 'bg-gray-100' : ''}`}
                  type="text"
                  icon={<item.icon className="flex items-center" />}
                  onClick={() => handleMenuClick({ key: item.key })}
                >
                  <span>{t(`canvas.toolbar.${item.key}`)}</span>
                </Button>
              </div>
            );
          }

          if (item.type === 'popover') {
            return (
              <SearchList key={item.key} domain={item.domain as SearchDomain} handleConfirm={handleConfirm} offset={12}>
                <div key={item.key} className="flex items-center w-full">
                  <Button
                    loading={getIsLoading(item.key)}
                    className={`w-full px-2 justify-start ${activeKey === item.key ? 'bg-gray-100' : ''}`}
                    type="text"
                    icon={<item.icon className="flex items-center" />}
                    onClick={() => handleMenuClick({ key: item.key })}
                  >
                    <span>{t(`canvas.toolbar.${item.key}`)}</span>
                  </Button>
                </div>
              </SearchList>
            );
          }

          if (item.type === 'divider') {
            return <Divider key={item.key} className="my-1 w-full" />;
          }
        })}
      </div>
    )
  );
};
