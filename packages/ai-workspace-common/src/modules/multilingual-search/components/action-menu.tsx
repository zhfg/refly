import React, { useState } from 'react';
import { Affix, Button, Checkbox, message } from 'antd';
import { useMultilingualSearchStore } from '../stores/multilingual-search';
import { SearchSelect } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import './action-menu.scss';
import {
  useImportResourceStoreShallow,
  useImportResourceStore,
} from '@refly-packages/ai-workspace-common/stores/import-resource';
import { UpsertResourceRequest } from '@refly/openapi-schema';

export const ActionMenu: React.FC<{ getTarget: () => HTMLElement }> = (props) => {
  const { t } = useTranslation();

  const { selectedItems, results, setSelectedItems } = useMultilingualSearchStore();
  const importResourceStore = useImportResourceStoreShallow((state) => ({
    selectedProjectId: state.selectedProjectId,
    setSelectedProjectId: state.setSelectedProjectId,
    setImportResourceModalVisible: state.setImportResourceModalVisible,
  }));
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? results : []);
  };

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      message.warning(t('resource.import.emptyLink'));
      return;
    }
    setSaveLoading(true);

    const { selectedProjectId } = useImportResourceStore.getState();
    const batchCreateResourceData: UpsertResourceRequest[] = selectedItems.map((item) => ({
      resourceType: 'weblink',
      title: item.title,
      data: {
        url: item.url,
        title: item.title,
      },
      projectId: selectedProjectId,
    }));

    try {
      const res = await getClient().batchCreateResource({
        body: batchCreateResourceData,
      });

      if (!res?.data?.success) {
        throw new Error('Save failed');
      }

      message.success(t('common.putSuccess'));
      setSelectedItems([]);
    } catch (err) {
      message.error(t('common.putError'));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Affix offsetBottom={0} target={props.getTarget}>
      <div className="intergation-footer">
        <div className="footer-location">
          <Checkbox
            checked={selectedItems.length === results.length}
            indeterminate={selectedItems.length > 0 && selectedItems.length < results.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          <p className="footer-count text-item">{t('resource.import.linkCount', { count: selectedItems.length })}</p>
          <div className="save-container">
            <p className="text-item save-text-item">{t('resource.import.saveTo')}</p>
            <SearchSelect
              defaultValue={''}
              domain="project"
              className="kg-selector"
              allowCreateNewEntity
              onChange={(value) => {
                if (!value) return;
                importResourceStore.setSelectedProjectId(value);
              }}
            />
          </div>
        </div>
        <div className="footer-action">
          <Button style={{ marginRight: 8 }} onClick={() => importResourceStore.setImportResourceModalVisible(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" onClick={handleSave} disabled={selectedItems.length === 0} loading={saveLoading}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Affix>
  );
};
