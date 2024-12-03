import { Button, Divider, Input, Message as message, Affix, Form } from '@arco-design/web-react';
import { HiOutlinePencil } from 'react-icons/hi';
import { useEffect, useState } from 'react';

// utils
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { UpsertResourceRequest } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { useCanvasControl } from '@refly-packages/ai-workspace-common/hooks/use-canvas-control';
import { useHandleSiderData } from '@refly-packages/ai-workspace-common/hooks/use-handle-sider-data';

const { TextArea } = Input;
const FormItem = Form.Item;

export const ImportFromText = () => {
  const { t } = useTranslation();
  const importResourceStore = useImportResourceStore();
  const { copiedTextPayload } = useImportResourceStore.getState();
  const { addNode } = useCanvasControl();

  const [saveLoading, setSaveLoading] = useState(false);
  const { getLibraryList } = useHandleSiderData();

  const handleSave = async () => {
    if (!copiedTextPayload?.content || !copiedTextPayload?.title) {
      message.warning(t('resource.import.emptyText'));
      return;
    }

    const createResourceData: UpsertResourceRequest = {
      resourceType: 'text',
      title: copiedTextPayload?.title,
      content: copiedTextPayload?.content,
      data: {
        url: copiedTextPayload?.url,
        title: copiedTextPayload?.title,
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
      });
    }
  };

  useEffect(() => {
    // 使用 copiedTextPayload 中的值初始化表单
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
      <div className="flex items-center gap-x-[8px] pt-[12px] px-[12px]">
        <span className="w-[18px] h-[18px] rounded-[4px] bg-[#f1f1f0] box-shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] flex items-center justify-center">
          <HiOutlinePencil />
        </span>
        <div className="text-[16px] font-bold">{t('resource.import.fromWeblink')}</div>
      </div>

      <Divider style={{ marginTop: 10, marginBottom: 10 }} />

      {/* content */}
      <div className="flex-grow overflow-y-auto px-[12px] box-border">
        <Form>
          <FormItem required layout="vertical" label={t('resource.import.textTitlePlaceholder')}>
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
                maxRows: 7,
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

      {/* footer */}
      <div className="w-full flex justify-end items-center border-t border-solid border-[#e5e5e5] border-x-0 border-b-0 p-[16px] rounded-none">
        <div className="flex items-center gap-x-[8px]">
          <Button style={{ marginRight: 8 }} onClick={() => importResourceStore.setImportResourceModalVisible(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            type="primary"
            loading={saveLoading}
            disabled={!copiedTextPayload?.content || !copiedTextPayload?.title}
            onClick={handleSave}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};
