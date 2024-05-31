import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { cnGuessQuestions, enGuessQuestions } from '@refly-packages/ai-workspace-common/utils/guess-question';
import { Button, Tabs } from '@arco-design/web-react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

// 自定义组件
import { KnowledgeBaseDirectory } from '../directory';
import { KnowledgeBaseResourceDetail } from '../resource-detail';
// 样式
import './index.scss';
import { useResizePanel } from '@refly-packages/ai-workspace-common/hooks/use-resize-panel';
import { ActionSource, useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { KnowledgeBaseListModal } from '../copilot/knowledge-base-list-modal';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';

const TabPane = Tabs.TabPane;

export const KnowledgeBaseDetail = () => {
  // directory minSize 270px ~ maxSize 50%
  const [minSize] = useResizePanel({
    groupSelector: 'knowledge-base-detail-panel-container',
    resizeSelector: 'knowledge-base-detail-panel-resize',
    initialMinSize: 24,
    initialMinPixelSize: 270,
  });

  const { tabs, activeTab, setActiveTab, handleDeleteTab } = useKnowledgeBaseTabs();
  const knowledgeBaseStore = useKnowledgeBaseStore();

  return (
    <div className="knowledge-base-detail-container">
      {/* <div className="knowledge-base-detail-header">
        <div className="knowledge-base-detail-navigation-bar">
          <Breadcrumb>
            <BreadcrumbItem href="/">工作台</BreadcrumbItem>
            <BreadcrumbItem
              href={`/knowledge-base/`}
              className="breadcrum-description">
              知识库
            </BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="knowledge-base-detail-nav-switcher">
          <Button
            icon={<IconFolder />}
            type="text"
            onClick={() => {
              knowledgeBaseStore.updateActionSource(ActionSource.KnowledgeBase)
              knowledgeBaseStore.updateKbModalVisible(true)
            }}
            className="chat-input-assist-action-item">
            <p className="assist-action-title">
              {knowledgeBaseStore?.currentKnowledgeBase?.title || "选择知识库"}
            </p>
            <IconCaretDown />
          </Button>
        </div>
        <div className="knowledge-base-detail-menu">
          <Button
            type="text"
            icon={<IconMore style={{ fontSize: 16 }} />}></Button>
        </div>
      </div> */}
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
              {/* <div className="knowledge-base-detail-navigation-bar">
                <Button
                  icon={<IconArrowLeft />}
                  type="text"
                  shape="circle"
                  className="nav-btn"></Button>
                <Button
                  icon={<IconArrowRight />}
                  type="text"
                  shape="circle"
                  className="nav-btn"></Button>
              </div> */}
              <div className="knowledge-base-detail-nav-switcher">
                <DefaultTabHeader {...props} />
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
        <Panel defaultSize={minSize} minSize={minSize} maxSize={50} className="knowledge-base-detail-directory-panel">
          <KnowledgeBaseDirectory />
        </Panel>
        <PanelResizeHandle className="knowledge-base-detail-panel-resize" />
        <Panel className="knowledge-base-detail-resource-panel" minSize={50}>
          <KnowledgeBaseResourceDetail />
        </Panel>
      </PanelGroup>
      {knowledgeBaseStore?.kbModalVisible && knowledgeBaseStore.actionSource === ActionSource.KnowledgeBase ? (
        <KnowledgeBaseListModal
          title="知识库"
          classNames="kb-list-modal"
          placement="right"
          width={360}
          height="100%"
          getPopupContainer={() => {
            const elem = document.querySelector('.knowledge-base-detail-container') as Element;

            console.log('getPopupContainer knowledge', elem);

            return elem;
          }}
        />
      ) : null}
    </div>
  );
};
