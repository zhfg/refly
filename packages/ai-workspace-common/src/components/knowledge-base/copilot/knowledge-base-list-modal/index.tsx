import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { Drawer } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
// 样式
import './index.scss';

// 自定义组件
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';

interface KnowledgeBaseListModalProps {
  getPopupContainer: () => Element;
  title: string;
  classNames: string;
  width?: number;
  height?: string;
  placement?: 'bottom' | 'left' | 'right' | 'top';
}

export const KnowledgeBaseListModal = (props: KnowledgeBaseListModalProps) => {
  const { t } = useTranslation();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { jumpNewKnowledgeBase } = useBuildThreadAndRun();

  const getPopupContainer = () => {
    if (props?.getPopupContainer) {
      return props.getPopupContainer();
    }

    return document.body;
  };

  return (
    <Drawer
      width={props.width || '100%'}
      style={{
        zIndex: 66,
        background: '#FCFCF9',
        height: props.height || '66%',
      }}
      getPopupContainer={getPopupContainer}
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
      <KnowledgeBaseList
        classNames={props.classNames}
        handleItemClick={(kbId) => {
          jumpNewKnowledgeBase(kbId);
          knowledgeBaseStore.updateKbModalVisible(false);
        }}
      />
    </Drawer>
  );
};
