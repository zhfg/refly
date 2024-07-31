import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { Drawer } from '@arco-design/web-react';
// 样式
import './index.scss';

// 自定义组件
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

interface KnowledgeBaseListModalProps {
  title: string;
  classNames: string;
  width?: number;
  height?: string;
  placement?: 'bottom' | 'left' | 'right' | 'top';
}

export const KnowledgeBaseListModal = (props: KnowledgeBaseListModalProps) => {
  const knowledgeBaseStore = useKnowledgeBaseStore();

  return (
    <Drawer
      width={props.width || '100%'}
      style={{
        zIndex: 66,
        background: '#FCFCF9',
        height: props.height || '66%',
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
      visible={knowledgeBaseStore.kbModalVisible}
      placement={props.placement || 'bottom'}
      footer={null}
      onOk={() => {
        knowledgeBaseStore.updateKbModalVisible(false);
      }}
      onCancel={() => {
        knowledgeBaseStore.updateKbModalVisible(false);
      }}
    >
      <KnowledgeBaseList />
    </Drawer>
  );
};
