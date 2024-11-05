import { Button, Divider, Input, Message as message, Affix, Form } from '@arco-design/web-react';
import { HiOutlinePencil } from 'react-icons/hi';
import { useEffect, useState } from 'react';

// utils
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { UpsertResourceRequest } from '@refly/openapi-schema';
import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { SearchSelect } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
import { useTranslation } from 'react-i18next';
import { useSaveResourceNotify } from '@refly-packages/ai-workspace-common/hooks/use-save-resouce-notify';
import { getClientOrigin } from '@refly/utils/url';

const { TextArea } = Input;
const FormItem = Form.Item;

export const ImportFromText = () => {
  const { t } = useTranslation();
  const importResourceStore = useImportResourceStore();
  const { handleSaveResourceAndNotify } = useSaveResourceNotify();

  const reloadListState = useReloadListState();
  const [queryParams] = useSearchParams();
  const kbId = queryParams.get('kbId');

  //
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSave = async () => {
    setSaveLoading(true);
    const { copiedTextPayload, selectedProjectId } = useImportResourceStore.getState();
    if (!copiedTextPayload?.content || !copiedTextPayload?.title) {
      message.warning(t('resource.import.emptyText'));
      return;
    }

    const createResourceData: UpsertResourceRequest = {
      resourceType: 'text',
      title: copiedTextPayload?.title,
      content: copiedTextPayload?.content,
      projectId: selectedProjectId,
      data: {
        url: copiedTextPayload?.url,
        title: copiedTextPayload?.title,
      },
    };

    try {
      const res = await getClient().createResource({
        body: createResourceData,
      });

      if (!res?.data?.success) {
        setSaveLoading(false);
        return { success: false };
      }

      importResourceStore.setCopiedTextPayload({ title: '', content: '' });
      importResourceStore.setImportResourceModalVisible(false);
      if (!kbId || (kbId && selectedProjectId === kbId)) {
        reloadListState.setReloadProjectList(true);
        reloadListState.setReloadResourceList(true);
      }

      setSaveLoading(false);
      const resourceId = res?.data?.data?.resourceId;
      const url = `${getClientOrigin(false)}/knowledge-base?resId=${resourceId}`;
      return { success: true, url };
    } catch (err) {
      setSaveLoading(false);
      return { success: false };
    }
  };

  useEffect(() => {
    importResourceStore.setSelectedProjectId(kbId);

    // 使用 copiedTextPayload 中的值初始化表单
    const { title, content, url } = importResourceStore.copiedTextPayload;
    if (title) importResourceStore.setCopiedTextPayload({ title });
    if (content) importResourceStore.setCopiedTextPayload({ content });
    if (url) importResourceStore.setCopiedTextPayload({ url });

    return () => {
      /* reset selectedCollectionId and copiedTextPayload after modal hide */
      importResourceStore.setSelectedProjectId('');
      importResourceStore.setCopiedTextPayload({ title: '', content: '', url: '' });
    };
  }, []);

  return (
    <div className="intergation-container intergation-import-from-weblink">
      <div className="intergation-content">
        <div className="intergation-operation-container">
          <div className="intergration-header">
            <span className="menu-item-icon">
              <HiOutlinePencil />
            </span>
            <span className="intergration-header-title">{t('resource.import.fromText')}</span>
          </div>
          <Divider />
          <div className="intergation-body">
            <div className="intergation-body-action">
              <Form>
                <FormItem layout="vertical" label={t('resource.import.textTitlePlaceholder')}>
                  <Input
                    // placeholder={t('resource.import.textTitlePlaceholder')}
                    value={importResourceStore.copiedTextPayload?.title}
                    onChange={(value) => importResourceStore.setCopiedTextPayload({ title: value })}
                  />
                </FormItem>
                <FormItem layout="vertical" label={t('resource.import.textUrlPlaceholder')}>
                  <Input
                    // placeholder={t('resource.import.textUrlPlaceholder')}
                    value={importResourceStore.copiedTextPayload?.url}
                    onChange={(value) => importResourceStore.setCopiedTextPayload({ url: value })}
                  />
                </FormItem>
                <FormItem required layout="vertical" label={t('resource.import.textContentPlaceholder')}>
                  <TextArea
                    // placeholder={t('resource.import.textContentPlaceholder')}
                    rows={4}
                    autoSize={{
                      minRows: 4,
                      maxRows: 8,
                    }}
                    showWordLimit
                    maxLength={6000}
                    value={importResourceStore.copiedTextPayload?.content}
                    allowClear
                    onChange={(value) => importResourceStore.setCopiedTextPayload({ content: value })}
                  />
                </FormItem>
              </Form>
            </div>
          </div>
        </div>
      </div>
      <Affix offsetBottom={0} target={() => document.querySelector('.import-resource-right-panel') as HTMLElement}>
        <div className="intergation-footer">
          <div className="footer-location">
            <div className="save-container">
              <p className="text-item">{t('resource.import.saveTo')} </p>
              <SearchSelect
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
            <Button type="primary" onClick={() => handleSaveResourceAndNotify(handleSave)}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Affix>
    </div>
  );
};
