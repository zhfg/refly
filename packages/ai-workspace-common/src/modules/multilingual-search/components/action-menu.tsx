import React, { useState } from 'react';
import { Button, Checkbox, message } from 'antd';
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

export const ActionMenu: React.FC = () => {
  const { t } = useTranslation();
  const { selectedItems, results, setSelectedItems } = useMultilingualSearchStore();
  const importResourceStore = useImportResourceStoreShallow((state) => ({
    selectedProjectId: state.selectedProjectId,
    setSelectedProjectId: state.setSelectedProjectId,
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
    <div className="action-menu">
      <div className="action-menu-left">
        <Checkbox
          checked={selectedItems.length === results.length}
          indeterminate={selectedItems.length > 0 && selectedItems.length < results.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          {/* {t('resource.import.selectAll')} */}
        </Checkbox>
        <span className="selected-count">{t('resource.import.linkCount', { count: selectedItems.length })}</span>
        <div className="project-selector">
          <span>{t('resource.import.saveTo')}</span>
          <SearchSelect
            domain="project"
            className="kg-selector"
            allowCreateNewEntity
            value={importResourceStore.selectedProjectId || ''}
            onChange={(value) => {
              if (!value) return;
              importResourceStore.setSelectedProjectId(value);
            }}
          />
        </div>
      </div>
      <div className="action-menu-right">
        <Button type="primary" onClick={handleSave} loading={saveLoading}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};
