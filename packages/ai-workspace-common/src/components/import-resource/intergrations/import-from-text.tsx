import { Form } from '@arco-design/web-react';
import { Button, Divider, Input, message } from 'antd';
import { HiOutlinePencil } from 'react-icons/hi';
import { useEffect, useState } from 'react';

// utils
import {
  useImportResourceStore,
  useImportResourceStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/import-resource';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { UpsertResourceRequest } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useHandleSiderData } from '@refly-packages/ai-workspace-common/hooks/use-handle-sider-data';
import { TbClipboard } from 'react-icons/tb';

const { TextArea } = Input;
const FormItem = Form.Item;

export const ImportFromText = () => {
  const { t } = useTranslation();
  const importResourceStore = useImportResourceStore();
  const { copiedTextPayload } = useImportResourceStore.getState();
  const { addNode } = useAddNode();
  const { insertNodePosition } = useImportResourceStoreShallow((state) => ({
    insertNodePosition: state.insertNodePosition,
  }));

  const [saveLoading, setSaveLoading] = useState(false);
  const { getLibraryList } = useHandleSiderData();

  const handleSave = async () => {
    if (!copiedTextPayload?.content) {
      message.warning(t('resource.import.emptyText'));
      return;
    }

    const createResourceData: UpsertResourceRequest = {
      resourceType: 'text',
      title: copiedTextPayload?.title || 'Untitled',
      content: copiedTextPayload?.content || '',
      data: {
        url: copiedTextPayload?.url || 'https://www.refly.ai',
        title: copiedTextPayload?.title || 'Untitled',
      },
    };
    setSaveLoading(true);
    const { data } = await getClient().createResource({
      body: createResourceData,
    });

    setSaveLoading(false);
    importResourceStore.setCopiedTextPayload({ title: '', content: '' });
    importResourceStore.setImportResourceModalVisible(false);

    if (data?.success) {
      getLibraryList();
      addNode({
        type: 'resource',
        data: {
          title: data?.data?.title || 'Untitled',
          entityId: data?.data?.resourceId,
          contentPreview: data?.data?.contentPreview,
        },
        position: insertNodePosition,
      });
    }
  };

  useEffect(() => {
    const { title, content, url } = importResourceStore.copiedTextPayload;
    if (title) importResourceStore.setCopiedTextPayload({ title });
    if (content) importResourceStore.setCopiedTextPayload({ content });
    if (url) importResourceStore.setCopiedTextPayload({ url });

    return () => {
      /* reset and copiedTextPayload after modal hide */
      importResourceStore.setCopiedTextPayload({ title: '', content: '', url: '' });
    };
  }, []);

  return (
    <div className="h-full flex flex-col min-w-[500px] box-border intergation-import-from-weblink">
      {/* header */}
      <div className="flex items-center gap-2 p-6">
        <span className="flex items-center justify-center">
          <TbClipboard className="text-lg" />
        </span>
        <div className="text-base font-bold">{t('resource.import.fromText')}</div>
      </div>

      {/* content */}
      <div className="flex-grow overflow-y-auto px-6 box-border">
        <Form>
          <FormItem layout="vertical" label={t('resource.import.textTitlePlaceholder')}>
            <Input
              // placeholder={t('resource.import.textTitlePlaceholder')}
              value={importResourceStore.copiedTextPayload?.title}
              onChange={(e) => importResourceStore.setCopiedTextPayload({ title: e.target.value })}
            />
          </FormItem>
          <FormItem layout="vertical" label={t('resource.import.textUrlPlaceholder')}>
            <Input
              // placeholder={t('resource.import.textUrlPlaceholder')}
              value={importResourceStore.copiedTextPayload?.url}
              onChange={(e) => importResourceStore.setCopiedTextPayload({ url: e.target.value })}
            />
          </FormItem>
          <FormItem required layout="vertical" label={t('resource.import.textContentPlaceholder')}>
            <TextArea
              // placeholder={t('resource.import.textContentPlaceholder')}
              rows={4}
              autoSize={{
                minRows: 4,
                maxRows: 7,
              }}
              maxLength={100000}
              value={importResourceStore.copiedTextPayload?.content}
              allowClear
              onChange={(e) => importResourceStore.setCopiedTextPayload({ content: e.target.value })}
            />
          </FormItem>
        </Form>
      </div>

      {/* footer */}
      <div className="w-full flex justify-end items-center border-t border-solid border-[#e5e5e5] border-x-0 border-b-0 p-[16px] rounded-none">
        <div className="flex items-center gap-x-[8px]">
          <Button style={{ marginRight: 8 }} onClick={() => importResourceStore.setImportResourceModalVisible(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" loading={saveLoading} disabled={!copiedTextPayload?.content} onClick={handleSave}>
            {t('common.saveToCanvas')}
          </Button>
        </div>
      </div>
    </div>
  );
};
