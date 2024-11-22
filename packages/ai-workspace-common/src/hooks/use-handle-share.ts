import React from 'react';
// components
import { message, Modal, Button } from 'antd';
import { FiCopy } from 'react-icons/fi';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';
import { useTranslation } from 'react-i18next';

import { EntityType } from '@refly/openapi-schema';

interface CreateShareParams {
  entityType: EntityType;
  entityId: string;
  shareCode?: string;
}

export const useHandleShare = () => {
  const { t } = useTranslation();
  const { project, setProject } = useProjectStoreShallow((state) => ({
    project: state.project?.data,
    setProject: state.setProject,
  }));

  const { canvas, updateCurrentCanvas } = useDocumentStoreShallow((state) => ({
    canvas: state.currentCanvas,
    updateCurrentCanvas: state.updateCurrentCanvas,
  }));

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t('common.copy.success'));
    } catch (err) {
      message.error(t('common.copy.failed'));
    }
  };

  const setShareCode = (entityType: EntityType, shareCode: string | undefined) => {
    if (entityType === 'project') {
      setProject({ ...project, shareCode });
    } else if (entityType === 'canvas') {
      updateCurrentCanvas({ ...canvas, shareCode });
    }
  };

  const handleDeleteShare = async ({ entityType, shareCode }: { entityType: EntityType; shareCode: string }) => {
    const { data } = await getClient().deleteShare({
      body: {
        shareCode,
      },
    });

    if (!data?.success) {
      message.error(t('projectDetail.share.cancelShareFailed'));
      throw new Error(data?.errMsg);
    }

    message.success(t('projectDetail.share.cancelShareSuccess'));
    setShareCode(entityType, undefined);
  };

  const createShare = async ({ entityType, entityId, shareCode: code }: CreateShareParams) => {
    let shareCode = '';
    if (code) {
      shareCode = code;
    } else {
      const { data } = await getClient().createShare({
        body: {
          entityType,
          entityId,
        },
      });

      if (!data?.success) {
        message.error(t('projectDetail.share.createShareFailed'));
        throw new Error(data?.errMsg);
      }

      shareCode = data?.data?.shareCode;
    }

    if (!shareCode) {
      message.error(t('projectDetail.share.createShareFailed'));
      return;
    }

    setShareCode(entityType, shareCode);

    const shareUrl = `${window.location.origin}/share/${shareCode}`;

    const modal = Modal.success({
      centered: true,
      closable: true,
      title: t('projectDetail.share.title', { entityType: t(`projectDetail.share.${entityType}`) }),
      content: React.createElement('div', null, [
        React.createElement(
          'p',
          { key: 'desc' },
          t('projectDetail.share.description', { entityType: t(`projectDetail.share.${entityType}`) }),
        ),
        React.createElement(
          'div',
          {
            className: 'flex items-center gap-2 mt-2 p-2 bg-gray-100 rounded-md',
          },
          [
            React.createElement(
              'span',
              {
                style: { flex: 1, wordBreak: 'break-all' },
              },
              shareUrl,
            ),
            React.createElement(Button, {
              key: 'copyBtn',
              type: 'text',
              icon: React.createElement(FiCopy),
              onClick: () => handleCopy(shareUrl),
            }),
          ],
        ),
      ]),
      width: 500,
      okText: t('projectDetail.share.cancel'),
      okButtonProps: {
        className: 'bg-[#00968F] text-white',
      },
      onOk: async () => {
        await handleDeleteShare({ entityType, shareCode });
        modal.destroy();
      },
    });
  };

  return {
    createShare,
  };
};
