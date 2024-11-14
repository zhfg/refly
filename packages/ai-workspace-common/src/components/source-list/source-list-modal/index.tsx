import {
  useKnowledgeBaseStore,
  useKnowledgeBaseStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '@arco-design/web-react';
import { Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { SourceDetailList } from '@refly-packages/ai-workspace-common/components/source-list/source-detail-list';
import { Source } from '@refly/openapi-schema';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import './index.scss';
import { IconLink, IconMessage } from '@arco-design/web-react/icon';
import { SearchResults } from '@refly-packages/ai-workspace-common/modules/multilingual-search/components/search-results';
import { ActionMenu } from '@refly-packages/ai-workspace-common/modules/multilingual-search/components/action-menu';
import {
  defaultLocalesMap,
  SearchLocale,
  useMultilingualSearchStoreShallow,
} from '@refly-packages/ai-workspace-common/modules/multilingual-search/stores/multilingual-search';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

const TabPane = Tabs.TabPane;

interface SourceListModalProps {
  classNames: string;
  width?: number;
  height?: string;
  placement?: 'bottom' | 'left' | 'right' | 'top';
}

export const SourceListModal = (props: SourceListModalProps) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('webSearch');
  const currentUiLocale = i18n.language as 'en' | 'zh-CN';
  const knowledgeBaseStore = useKnowledgeBaseStoreShallow((state) => ({
    sourceListDrawer: state.sourceListDrawer,
    updateSourceListDrawer: state.updateSourceListDrawer,
  }));
  const { jumpToResource, jumpToCanvas } = useJumpNewPath();

  const outputLocale: SearchLocale = useMemo(
    () => ({
      code: currentUiLocale,
      name:
        defaultLocalesMap[currentUiLocale].find((locale) => locale.code === currentUiLocale)?.name || currentUiLocale,
    }),
    [currentUiLocale],
  );

  // 移除不必要的状态订阅
  const { setResults, setIsSearching } = useMultilingualSearchStoreShallow((state) => ({
    setResults: state.setResults,
    setIsSearching: state.setIsSearching,
  }));

  const runtime = getRuntime();
  const isWeb = runtime === 'web';
  const width = isWeb ? '50%' : props.width || '100%';
  const height = isWeb ? '100%' : props.height || '66%';

  // 将资源分类逻辑移到 useMemo 中
  const groupedSources = useMemo(() => {
    return (knowledgeBaseStore?.sourceListDrawer?.sources || []).reduce(
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
  }, [knowledgeBaseStore?.sourceListDrawer?.sources]);

  console.log('groupedSources', groupedSources);

  // 初始化搜索结果到 store
  useEffect(() => {
    if (activeTab === 'webSearch' && knowledgeBaseStore.sourceListDrawer.visible) {
      setResults(groupedSources.webSearch);
      setIsSearching(false);
    } else if (activeTab === 'library' && knowledgeBaseStore.sourceListDrawer.visible) {
      setResults(groupedSources.library);
      setIsSearching(false);
    } else {
      // 清理状态
      setResults([]);
      setIsSearching(false);
    }
  }, [knowledgeBaseStore.sourceListDrawer.visible, groupedSources.webSearch, groupedSources.library, activeTab]);

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
      className="source-list-modal"
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
        // 清理搜索结果
        setResults([]);
        setIsSearching(false);
      }}
    >
      <div className="source-list-modal-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          defaultActiveKey="webSearch"
          items={[
            {
              key: 'webSearch',
              label: (
                <span>
                  {t('copilot.sourceListModal.webSearchTab')} ({groupedSources.webSearch.length})
                </span>
              ),
              children: (
                <div className="source-list-modal-web-search">
                  {groupedSources.webSearch.length > 0 && (
                    <>
                      <SearchResults
                        outputLocale={outputLocale}
                        config={{
                          showCheckbox: true,
                          showIndex: true,
                          handleItemClick: (item) => {
                            window.open(item.url, '_blank');
                          },
                        }}
                      />
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'library',
              label: (
                <span>
                  {t('copilot.sourceListModal.libraryTab')} ({groupedSources.library.length})
                </span>
              ),
              children: (
                <div className="source-list-modal-web-search">
                  <SearchResults
                    outputLocale={outputLocale}
                    config={{
                      showCheckbox: false,
                      showIndex: true,
                      startIndex: groupedSources.webSearch.length + 1,
                      handleItemClick: (item) => {
                        if (item?.metadata?.sourceType === 'library' && item?.metadata?.entityType === 'resource') {
                          jumpToResource({ resId: item.metadata.entityId });
                          knowledgeBaseStore.updateSourceListDrawer({ visible: false });
                        } else if (
                          item?.metadata?.sourceType === 'library' &&
                          item?.metadata?.entityType === 'canvas'
                        ) {
                          jumpToCanvas({ canvasId: item.metadata?.entityId, projectId: item?.metadata?.projectId });
                          knowledgeBaseStore.updateSourceListDrawer({ visible: false });
                        }
                      },
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
        {activeTab === 'webSearch' && groupedSources.webSearch.length > 0 && (
          <div className="source-list-modal-action-menu-container">
            <ActionMenu
              getTarget={() => document.querySelector('.source-list-modal-tabs') as HTMLElement}
              sourceType="sourceListModal"
            />
          </div>
        )}
      </div>
    </Drawer>
  );
};
