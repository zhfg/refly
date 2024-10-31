import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { Drawer } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
// 样式
import './index.scss';

// 自定义组件
import { ConvList } from '@refly-packages/ai-workspace-common/components/conv-list';
import { useNavigate, useParams, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

interface ConvListModalProps {
  title: string;
  classNames: string;
  placement?: 'bottom' | 'left' | 'right' | 'top';
  source: MessageIntentSource;
}

export const ConvListModal = (props: ConvListModalProps) => {
  const { t } = useTranslation();
  const { source } = props;
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const params = useParams();
  const { jumpToConv } = useJumpNewPath();

  return (
    <div style={{ width: '100%' }} className="conv-list-modal-container">
      <Drawer
        width="100%"
        style={{
          zIndex: 66,
          height: '66%',
          background: '#FCFCF9',
        }}
        getPopupContainer={() => {
          const container = getPopupContainer();
          return container?.querySelector('.ai-copilot-container') as Element;
        }}
        headerStyle={{ justifyContent: 'center' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>{props.title || ''}</span>
          </div>
        }
        visible={knowledgeBaseStore.convModalVisible}
        placement={props.placement || 'bottom'}
        footer={null}
        onOk={() => {
          knowledgeBaseStore.updateConvModalVisible(false);
        }}
        onCancel={() => {
          knowledgeBaseStore.updateConvModalVisible(false);
        }}
      >
        <ConvList
          classNames={props.classNames}
          handleConvItemClick={(convId) => {
            if (source === MessageIntentSource.Project) {
              const projectId = params.projectId;
              jumpToConv({
                convId,
                projectId,
                state: {
                  navigationContext: {
                    shouldFetchDetail: true,
                    source,
                  },
                },
              });
            } else if (source === MessageIntentSource.Resource) {
              jumpToConv({
                resourceId: params.resId,
                convId,
                state: {
                  navigationContext: {
                    shouldFetchDetail: true,
                    source,
                  },
                },
              });
            } else if (source === MessageIntentSource.ConversationDetail) {
              jumpToConv({
                convId,
                state: {
                  navigationContext: {
                    shouldFetchDetail: true,
                    source,
                  },
                },
              });
            }
            knowledgeBaseStore.updateConvModalVisible(false);
          }}
        />
      </Drawer>
    </div>
  );
};
