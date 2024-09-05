import { Divider, Modal, Menu } from '@arco-design/web-react';
import { AiOutlineImport } from 'react-icons/ai';
import { HiOutlinePencil, HiLink } from 'react-icons/hi';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';

// 组件
import { ImportFromWeblink } from './intergrations/import-from-weblink';
import { ImportFromText } from './intergrations/import-from-text';
import { useTranslation } from 'react-i18next';

// 样式
import './index.scss';
import { useState } from 'react';

const MenuItem = Menu.Item;

export const ImportResourceModal = () => {
  const { t } = useTranslation();
  const importResourceStore = useImportResourceStore();
  const [selectedMenuItem, setSelectedMenuItem] = useState('import-from-weblink');

  return (
    <Modal
      unmountOnExit
      visible={importResourceStore.importResourceModalVisible}
      footer={null}
      onCancel={() => {
        importResourceStore.setImportResourceModalVisible(false);
      }}
      className="import-resource-modal"
      style={{ height: '70%', minHeight: 500, maxHeight: 700, minWidth: 1000, maxWidth: 1200 }}
    >
      <div className="import-resource-container">
        <div className="import-resource-left-panel">
          <div className="left-panel-header">
            <div className="left-panel-header-title">
              <AiOutlineImport />
              <span className="left-panel-header-title-text">{t('resource.import.title')}</span>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Menu
              className="left-panel-menu"
              selectedKeys={[selectedMenuItem]}
              onClickMenuItem={(key) => {
                setSelectedMenuItem(key);
              }}
            >
              <h2 className="left-panel-menu-title">{t('resource.import.integration')}</h2>
              <MenuItem key="import-from-weblink" className="left-panel-menu-item">
                <span className="menu-item-icon">
                  <HiLink />
                </span>
                {t('resource.import.fromWeblink')}
              </MenuItem>
              <MenuItem key="import-from-paste-text" className="left-panel-menu-item">
                <span className="menu-item-icon">
                  <HiOutlinePencil />
                </span>
                {t('resource.import.fromText')}
              </MenuItem>
            </Menu>
          </div>
        </div>
        <div className="import-resource-right-panel">
          {selectedMenuItem === 'import-from-weblink' ? <ImportFromWeblink /> : null}
          {selectedMenuItem === 'import-from-paste-text' ? <ImportFromText /> : null}
        </div>
      </div>
    </Modal>
  );
};
