import { useEffect, useState } from 'react';
import { Button, Tabs } from '@arco-design/web-react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

// 自定义组件
import { KnowledgeBaseDirectory } from '../directory';
import { KnowledgeBaseResourceDetail } from '../resource-detail';
import { KnowledgeBaseDetailEmpty } from '../knowledge-base-detail-empty';
// 样式
import './index.scss';
import { ActionSource, useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { KnowledgeBaseListModal } from '../copilot/knowledge-base-list-modal';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';
import { HiOutlineSearch } from 'react-icons/hi';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

const TabPane = Tabs.TabPane;

export const KnowledgeBaseDetail = () => {
  const searchStore = useSearchStore();

  const [queryParams] = useSearchParams();
  const resId = queryParams.get('resId');
  const kbId = queryParams.get('kbId');
  const [leftPanelSize, setLeftPanelSize] = useState(30);

  const { tabs, activeTab, setActiveTab, handleDeleteTab } = useKnowledgeBaseTabs();
  const knowledgeBaseStore = useKnowledgeBaseStore((state) => ({
    kbModalVisible: state.kbModalVisible,
    actionSource: state.actionSource,
    updateResourcePanelVisible: state.updateResourcePanelVisible,
  }));

  useEffect(() => {
    knowledgeBaseStore.updateResourcePanelVisible(true);

    return () => {
      knowledgeBaseStore.updateResourcePanelVisible(false);
    };
  }, [resId]);

  if ((!resId || resId === 'undefined' || resId === 'null') && (!kbId || kbId === 'undefined' || kbId === 'null')) {
    return <KnowledgeBaseDetailEmpty />;
  }

  return (
    <div className="knowledge-base-detail-container">
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
                <Button
                  icon={<HiOutlineSearch />}
                  type="text"
                  shape="circle"
                  className="assist-action-item"
                  onClick={() => {
                    searchStore.setPages(searchStore.pages.concat('readResources'));
                    searchStore.setIsSearchOpen(true);
                  }}
                ></Button>
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
              collapsible={true}
              className="knowledge-base-detail-directory-panel"
              style={{ flex: `${leftPanelSize} 1 0px` }}
              onResize={(size) => setLeftPanelSize(size)}
            >
              <KnowledgeBaseDirectory />
            </Panel>
            <PanelResizeHandle
              className={`knowledge-base-detail-panel-resize ${leftPanelSize === 0 ? 'left-panel-hidden' : ''}`}
            >
              <div
                onClick={(e) => {
                  // e.stopPropagation();
                  setLeftPanelSize(leftPanelSize === 0 ? 30 : 0);
                }}
                className="toggle-left-panel-btn"
              >
                {leftPanelSize === 0 ? <HiChevronRight /> : <HiChevronLeft />}
              </div>
            </PanelResizeHandle>
          </>
        ) : null}

        <Panel className="knowledge-base-detail-resource-panel" minSize={50}>
          <KnowledgeBaseResourceDetail />
        </Panel>
      </PanelGroup>
      {knowledgeBaseStore?.kbModalVisible && knowledgeBaseStore.actionSource === ActionSource.KnowledgeBase ? (
        <KnowledgeBaseListModal title="知识库" classNames="kb-list-modal" placement="right" width={360} height="100%" />
      ) : null}
    </div>
  );
};
