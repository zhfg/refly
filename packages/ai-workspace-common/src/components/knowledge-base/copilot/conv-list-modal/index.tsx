import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { Drawer } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
// 样式
import './index.scss';

// 自定义组件
import { ConvList } from '@refly-packages/ai-workspace-common/components/conv-list';
import { useNavigate } from 'react-router-dom';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

interface ConvListModalProps {
  title: string;
  classNames: string;
  placement?: 'bottom' | 'left' | 'right' | 'top';
}

export const ConvListModal = (props: ConvListModalProps) => {
  const { t } = useTranslation();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { jumpNewConvQuery } = useBuildThreadAndRun();

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
            jumpNewConvQuery(convId);
            knowledgeBaseStore.updateConvModalVisible(false);
          }}
        />
      </Drawer>
    </div>
  );
};
