import { useEffect, useState, useRef, useCallback, memo } from 'react';
import throttle from 'lodash.throttle';
import { Button, Tabs, Tooltip } from '@arco-design/web-react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

// 自定义组件
import { KnowledgeBaseDirectory } from '../directory';
import { KnowledgeBaseResourceDetail } from '../resource-detail';
import { KnowledgeBaseDetailEmpty } from '../knowledge-base-detail-empty';
// 样式
import './index.scss';
import { ActionSource, useKnowledgeBaseStoreShallow } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { ProjectListModal } from '../copilot/project-list-modal';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';
import { HiOutlineSearch } from 'react-icons/hi';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { IconSearch } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

const TabPane = Tabs.TabPane;
const MIN_LEFT_PANEL_SIZE = 72;

export const KnowledgeBaseDetail = () => {
  const { t } = useTranslation();
  const [queryParams] = useSearchParams();
  const resId = queryParams.get('resId');
  const kbId = queryParams.get('kbId');

  const [leftPanelSize, setLeftPanelSize] = useState(30);
  const [isSmall, setIsSmall] = useState(false);
  const [hideBtn, setHideBtn] = useState(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tabs, activeTab, setActiveTab, handleDeleteTab } = useKnowledgeBaseTabs();

  const searchStore = useSearchStoreShallow((state) => ({
    pages: state.pages,
    setPages: state.setPages,
    setIsSearchOpen: state.setIsSearchOpen,
  }));

  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    kbModalVisible: state.kbModalVisible,
    actionSource: state.actionSource,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
    updateCurrentKnowledgeBase: state.updateCurrentKnowledgeBase,
  }));

  useEffect(() => {
    knowledgeBaseStore.updateResourcePanelVisible(true);

    return () => {
      knowledgeBaseStore.updateResourcePanelVisible(false);
    };
  }, [resId]);

  useEffect(() => {
    if (!kbId) {
      knowledgeBaseStore.updateCurrentKnowledgeBase(null);
    }
  }, [kbId]);

  const handleResize = useCallback(
    throttle((entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        if (entry.contentRect.width < 180) {
          setIsSmall(true);
          setLeftPanelSize(0);
        } else {
          setIsSmall(false);
        }
      }
    }, 200),
    [],
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleResize);

    if (leftPanelRef.current && kbId) {
      resizeObserver.observe(leftPanelRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      handleResize.cancel();
    };
  }, [kbId, handleResize]);

  const handleContainerResize = useCallback(
    throttle((entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        setHideBtn(entry.contentRect.width <= 620);
      }
    }, 200),
    [],
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleContainerResize);
    if (containerRef.current && kbId) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      handleResize.cancel();
    };
  }, [kbId, handleContainerResize]);

  if ((!resId || resId === 'undefined' || resId === 'null') && (!kbId || kbId === 'undefined' || kbId === 'null')) {
    return <KnowledgeBaseDetailEmpty />;
  }

  return (
    <div className="knowledge-base-detail-container" ref={containerRef}>
      <Tabs
        editable
        className="knowledge-base-detail-tab-container"
        type="card-gutter"
        showAddButton={false}
        activeTab={activeTab}
        onDeleteTab={handleDeleteTab}
        onChange={setActiveTab}
        renderTabHeader={(props, DefaultTabHeader) => {
          return (
            <div className="knowledge-base-detail-header">
              <div className="knowledge-base-detail-nav-switcher">
                <DefaultTabHeader {...props} />
              </div>
              <div className="knowledge-base-detail-navigation-bar">
                <Tooltip content={t('knowledgeBase.header.searchAndOpenResourceOrCollection')}>
                  <Button
                    icon={<IconSearch />}
                    type="text"
                    shape="circle"
                    className="assist-action-item-header"
                    onClick={() => {
                      searchStore.setPages(searchStore.pages.concat('readResources'));
                      searchStore.setIsSearchOpen(true);
                    }}
                  ></Button>
                </Tooltip>
              </div>
            </div>
          );
        }}
      >
        {tabs.map((x, i) => (
          <TabPane destroyOnHide key={x.key} title={x.title}>
            <div></div>
          </TabPane>
        ))}
      </Tabs>
      <PanelGroup direction="horizontal" className="knowledge-base-detail-panel-container">
        {kbId ? (
          <>
            <Panel
              maxSize={30}
              collapsible={false}
              className="knowledge-base-detail-directory-panel"
              style={{ flexGrow: leftPanelSize, minWidth: `${MIN_LEFT_PANEL_SIZE}px` }}
              onResize={(size) => setLeftPanelSize(size)}
            >
              <div ref={leftPanelRef}>
                <KnowledgeBaseDirectory small={isSmall} />
              </div>
            </Panel>
            <PanelResizeHandle className="knowledge-base-detail-panel-resize">
              {!hideBtn && (
                <div
                  onClick={() => {
                    setLeftPanelSize(isSmall ? 30 : 0);
                  }}
                  className="toggle-left-panel-btn"
                >
                  {isSmall ? <HiChevronRight /> : <HiChevronLeft />}
                </div>
              )}
            </PanelResizeHandle>
          </>
        ) : null}

        <Panel className="knowledge-base-detail-resource-panel" minSize={50}>
          <KnowledgeBaseResourceDetail />
        </Panel>
      </PanelGroup>
      {knowledgeBaseStore?.kbModalVisible && knowledgeBaseStore.actionSource === ActionSource.KnowledgeBase ? (
        <ProjectListModal title="知识库" classNames="kb-list-modal" placement="right" width={360} height="100%" />
      ) : null}
    </div>
  );
};
