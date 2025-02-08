import { useState } from 'react';
import { Button, message, Upload, UploadProps } from 'antd';
import { HiLink } from 'react-icons/hi';
import { RiInboxArchiveLine } from 'react-icons/ri';
import { useImportResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/import-resource';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import type { Resource } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useSubscriptionUsage } from '@refly-packages/ai-workspace-common/hooks/use-subscription-usage';
import { StorageLimit } from './storageLimit';
import type { RcFile } from 'antd/es/upload/interface';
import { genResourceID } from '@refly-packages/utils/id';

const { Dragger } = Upload;

interface FileItem {
  title: string;
  url: string;
  storageKey: string;
  uid?: string;
  status?: 'uploading' | 'done' | 'error';
}

export const ImportFromFile = () => {
  const { t } = useTranslation();
  const { setImportResourceModalVisible, insertNodePosition } = useImportResourceStoreShallow(
    (state) => ({
      setImportResourceModalVisible: state.setImportResourceModalVisible,
      insertNodePosition: state.insertNodePosition,
    }),
  );

  const { addNode } = useAddNode();
  const { refetchUsage, storageUsage } = useSubscriptionUsage();

  const [saveLoading, setSaveLoading] = useState(false);
  const [fileList, setFileList] = useState<FileItem[]>([]);

  const uploadFile = async (file: File, resourceId: string) => {
    const { data } = await getClient().upload({
      body: {
        file,
        entityId: resourceId,
        entityType: 'resource',
      },
    });
    if (data.success) {
      return { ...data.data, resourceId };
    }
    return { url: '', storageKey: '', resourceId };
  };

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    fileList: fileList.map((item) => ({
      uid: item.uid,
      name: item.title,
      status: item.status,
      url: item.url,
    })),
    beforeUpload: async (file: File) => {
      const resourceId = genResourceID();
      setFileList((prev) => [
        ...prev,
        {
          title: file.name,
          url: '',
          storageKey: '',
          uid: resourceId,
          status: 'uploading',
        },
      ]);

      const data = await uploadFile(file, resourceId);
      if (data?.url && data?.storageKey) {
        setFileList((prev) =>
          prev.map((item) =>
            item.uid === resourceId
              ? {
                  title: file.name,
                  url: data.url,
                  storageKey: data.storageKey,
                  uid: data.resourceId,
                  status: 'done',
                }
              : item,
          ),
        );
      } else {
        setFileList((prev) => prev.filter((item) => item.uid !== resourceId));
        message.error(`${t('common.uploadFailed')}: ${file.name}`);
      }

      return false;
    },
    onRemove: (file: RcFile) => {
      setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    },
  };

  const handleSave = async () => {
    if (fileList.length === 0) {
      message.warning(t('resource.import.emptyFile'));
      return;
    }

    setSaveLoading(true);

    const { data } = await getClient().batchCreateResource({
      body: fileList.map((file) => ({
        resourceType: 'file',
        title: file.title,
        resourceId: file.uid,
        data: {
          url: file.url,
          title: file.title,
          storageKey: file.storageKey,
        },
      })),
    });

    setSaveLoading(false);
    if (!data?.success) {
      message.error(t('common.putFailed'));
      return;
    }

    refetchUsage();
    message.success(t('common.putSuccess'));
    setImportResourceModalVisible(false);

    const resources = Array.isArray(data.data)
      ? (data.data as Resource[]).map((resource) => ({
          id: resource.resourceId,
          title: resource.title,
          domain: 'resource',
          contentPreview: resource.contentPreview,
        }))
      : [];

    for (const [index, resource] of resources.entries()) {
      const nodePosition = insertNodePosition
        ? {
            x: insertNodePosition.x + index * 300,
            y: insertNodePosition.y,
          }
        : null;
      addNode({
        type: 'resource',
        data: {
          title: resource.title,
          entityId: resource.id,
          contentPreview: resource.contentPreview,
        },
        position: nodePosition,
      });
    }
  };

  const canImportCount = storageUsage?.fileCountQuota - (storageUsage?.fileCountUsed ?? 0);
  const disableSave = fileList.length === 0 || fileList.length > canImportCount;

  return (
    <div className="h-full flex flex-col min-w-[500px] box-border intergation-import-from-weblink">
      {/* header */}
      <div className="flex items-center gap-x-[8px] pt-6 px-6">
        <span className="flex items-center justify-center">
          <HiLink className="text-lg" />
        </span>
        <div className="text-base font-bold">{t('resource.import.fromFile')}</div>
      </div>

      {/* content */}
      <div className="flex-grow overflow-y-auto p-6 box-border flex flex-col justify-center">
        <div className="w-full">
          <Dragger {...props}>
            <RiInboxArchiveLine className="text-2xl text-gray-400" />
            <p className="ant-upload-text mt-4 text-gray-600">{t('resource.import.dragOrClick')}</p>
            <p className="ant-upload-hint text-gray-400 mt-2">
              {t('resource.import.supportedFiles', {
                formats:
                  'PDF、DOCX、TXT、MARKDOWN、MDX、HTML、EPUB、RTF、ODT、CSV、XLSX、PPTX、Python、JavaScript',
              })}
            </p>
          </Dragger>
        </div>
      </div>

      {/* footer */}
      <div className="w-full flex justify-between items-center border-t border-solid border-[#e5e5e5] border-x-0 border-b-0 p-[16px] rounded-none">
        <div className="flex items-center gap-x-[8px]">
          <p className="font-bold whitespace-nowrap text-md text-[#00968f]">
            {t('resource.import.fileCount', { count: fileList?.length || 0 })}
          </p>
          <StorageLimit resourceCount={fileList?.length || 0} />
        </div>

        <div className="flex items-center gap-x-[8px] flex-shrink-0">
          <Button onClick={() => setImportResourceModalVisible(false)}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={handleSave} disabled={disableSave} loading={saveLoading}>
            {t('common.saveToCanvas')}
          </Button>
        </div>
      </div>
    </div>
  );
};
