import { Modal } from '@arco-design/web-react';
import { IconImport } from '@arco-design/web-react/icon';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';

// 样式
import './index.scss';

export const ImportResourceModal = () => {
  const importResourceStore = useImportResourceStore();

  return (
    <Modal
      visible={importResourceStore.importResourceModalVisible}
      footer={null}
      closeIcon={null}
      className="import-resource-modal"
      style={{ width: '80%', height: 'calc(100% - 240px)' }}
    >
      <div className="import-resource-container">
        <div className="import-resource-left-panel">
          <div className="left-panel-header">
            <div>
              <IconImport />
              <span>资源集成</span>
            </div>
          </div>
        </div>
        <div className="import-resource-right-panel"></div>
      </div>
    </Modal>
  );
};
