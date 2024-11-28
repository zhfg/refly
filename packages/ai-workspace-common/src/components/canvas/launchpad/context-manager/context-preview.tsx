import React, { useEffect, useState } from 'react';
import { Button, Empty, Message as message, Spin } from '@arco-design/web-react';
import { IconClose, IconDelete, IconLink } from '@arco-design/web-react/icon';
import { Mark } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useMatch, useSearchParams, useParams } from '@refly-packages/ai-workspace-common/utils/router';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

export const ContextPreview = ({
  item,
  canNotRemove,
  onClose,
  onRemove,
  onOpenUrl,
}: {
  item: CanvasNode;
  canNotRemove?: boolean;
  onClose: () => void;
  onRemove?: (item: CanvasNode) => void;
  onOpenUrl: (url: string | (() => string) | (() => void)) => void;
}) => {
  const { t } = useTranslation();
  const isShare = useMatch('/share/:shareCode');
  const { shareCode } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  console.log('item', item);

  const [content, setContent] = useState<string>((item?.data?.metadata?.contentPreview as string) || '');
  const [isLoading, setIsLoading] = useState(false);

  const getDocumentDetail = async (docId: string) => {
    setIsLoading(true);
    const { data, error } = await getClient().getDocumentDetail({
      query: { docId },
    });
    setIsLoading(false);

    if (error) {
      return;
    }

    setContent(data?.data?.content);
  };

  const getResourceDetail = async (resourceId: string) => {
    setIsLoading(true);
    const { data: newRes, error } = await getClient().getResourceDetail({
      query: {
        resourceId,
      },
    });
    setIsLoading(false);

    if (error) {
      return;
    }

    setContent(newRes?.data?.content);
  };

  const getShareDocument = async (targetDocId?: string) => {
    setIsLoading(true);
    const { data } = await getClient().getShareContent({
      query: {
        shareCode: shareCode || '',
        ...(targetDocId ? { docId: targetDocId } : {}),
      },
    });
    setIsLoading(false);

    if (!data?.success) {
      return;
    }
    const result = data.data;

    setContent(result?.document?.content);
  };

  const handleShareCanvasChange = (canvasId: string) => {
    setSearchParams({ canvasId }, { replace: true });
  };

  useEffect(() => {
    if (item.type === 'document') {
      if (isShare) {
        getShareDocument(item.data?.entityId as string);
      } else {
        getDocumentDetail(item.data?.entityId as string);
      }
    } else if (item.type === 'resource') {
      getResourceDetail(item.data?.entityId as string);
    } else {
      setContent((item.data?.metadata?.contentPreview as string) || '');
    }
  }, [item.id]);

  return (
    <div className="context-preview">
      {isLoading ? (
        <Spin
          style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        />
      ) : (
        <>
          <div className="preview-action-container">
            <div className="preview-actions">
              {!(isShare && item.type === 'document') && (
                <Button
                  className="preview-action-btn"
                  icon={<IconLink />}
                  type="outline"
                  size="mini"
                  onClick={() => {
                    if (isShare) {
                      handleShareCanvasChange(item.id);
                    } else {
                      onOpenUrl(item?.data?.metadata?.url as any);
                    }
                  }}
                >
                  {t('common.open')}
                </Button>
              )}

              {!canNotRemove && (
                <Button
                  className="preview-action-btn"
                  icon={<IconDelete />}
                  type="outline"
                  size="mini"
                  onClick={() => onRemove && onRemove(item)}
                >
                  {t('common.delete')}
                </Button>
              )}
              <Button className="preview-action-btn" icon={<IconClose />} type="outline" size="mini" onClick={onClose}>
                {t('common.close')}
              </Button>
            </div>
          </div>
          <div className="preview-content">
            {content ? <Markdown content={content} /> : <Empty description={t('common.empty')} />}
          </div>
        </>
      )}
    </div>
  );
};
