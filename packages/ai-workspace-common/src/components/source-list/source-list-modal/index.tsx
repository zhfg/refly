import {
  useKnowledgeBaseStore,
  useKnowledgeBaseStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { Drawer, Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { SourceDetailList } from '@refly-packages/ai-workspace-common/components/source-list/source-detail-list';
import { Source } from '@refly/openapi-schema';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import './index.scss';
import { IconLink, IconMessage } from '@arco-design/web-react/icon';

const TabPane = Tabs.TabPane;

interface SourceListModalProps {
  classNames: string;
  width?: number;
  height?: string;
  placement?: 'bottom' | 'left' | 'right' | 'top';
}

export const SourceListModal = (props: SourceListModalProps) => {
  const { t } = useTranslation();
  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    sourceListDrawer: state.sourceListDrawer,
    updateSourceListDrawer: state.updateSourceListDrawer,
  }));
  const runtime = getRuntime();
  const isWeb = runtime === 'web';

  const width = isWeb ? '50%' : props.width || '100%';
  const height = isWeb ? '100%' : props.height || '66%';

  // 将资源按来源分类
  const groupedSources = (knowledgeBaseStore?.sourceListDrawer?.sources || []).reduce(
    (acc, source) => {
      const sourceType = source?.metadata?.sourceType || 'library';
      if (sourceType === 'webSearch') {
        acc.webSearch.push(source);
      } else {
        acc.library.push(source);
      }
      return acc;
    },
    { webSearch: [], library: [] } as { webSearch: Source[]; library: Source[] },
  );

  return (
    <Drawer
      width={width}
      style={{
        zIndex: 66,
        background: '#FCFCF9',
        height: height,
      }}
      getPopupContainer={() => {
        const container = getPopupContainer();
        return !isWeb ? (container.querySelector('.ai-copilot-container') as Element) : container;
      }}
      headerStyle={{
        padding: '16px 24px',
        height: 'auto',
        borderBottom: '1px solid var(--color-border-2)',
      }}
      title={
        <div className="source-list-modal-header">
          <div className="header-content">
            <IconLink className="header-icon" />
            <div className="header-text">
              <div>
                <span style={{ fontWeight: 'bold' }}>
                  {`${t('copilot.sourceListModal.title')} (${knowledgeBaseStore?.sourceListDrawer?.sources?.length || 0})`}
                </span>
              </div>
            </div>
          </div>
          <div className="source-list-modal-header-title-message">
            {knowledgeBaseStore?.sourceListDrawer?.currentHumanMessage?.content}
          </div>
        </div>
      }
      visible={knowledgeBaseStore.sourceListDrawer.visible}
      placement={isWeb ? 'right' : props.placement || 'bottom'}
      footer={null}
      onOk={() => {
        knowledgeBaseStore.updateSourceListDrawer({ visible: false });
      }}
      onCancel={() => {
        knowledgeBaseStore.updateSourceListDrawer({ visible: false });
      }}
    >
      <Tabs defaultActiveTab="webSearch">
        <TabPane
          key="webSearch"
          title={
            <span>
              {t('copilot.sourceListModal.webSearchTab')} ({groupedSources.webSearch.length})
            </span>
          }
        >
          <SourceDetailList
            placeholder={t('copilot.sourceListModal.searchPlaceholder')}
            sources={groupedSources.webSearch}
            classNames={props.classNames}
            handleItemClick={() => {}}
          />
        </TabPane>
        <TabPane
          key="library"
          title={
            <span>
              {t('copilot.sourceListModal.libraryTab')} ({groupedSources.library.length})
            </span>
          }
        >
          <SourceDetailList
            placeholder={t('copilot.sourceListModal.searchPlaceholder')}
            sources={groupedSources.library}
            classNames={props.classNames}
            handleItemClick={() => {}}
          />
        </TabPane>
      </Tabs>
    </Drawer>
  );
};
