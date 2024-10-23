import React, { useEffect, useState } from 'react';
import { Button, Empty, Message as message, Spin } from '@arco-design/web-react';
import { IconClose, IconDelete, IconLink } from '@arco-design/web-react/icon';
import { Mark } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export const ContextPreview = ({
  item,
  canNotRemove,
  onClose,
  onRemove,
  onOpenUrl,
}: {
  item: Mark;
  canNotRemove?: boolean;
  onClose: () => void;
  onRemove?: (id: string) => void;
  onOpenUrl: (url: string | (() => string) | (() => void)) => void;
}) => {
  const { t } = useTranslation();

  const [content, setContent] = useState(item.data);
  const [isLoading, setIsLoading] = useState(false);

  const getCanvasDetail = async (canvasId: string) => {
    setIsLoading(true);
    const { data, error } = await getClient().getCanvasDetail({
      query: { canvasId },
    });
    if (error) {
      message.error(t('contentDetail.list.fetchErr'));
    }

    setContent(data?.data?.content);
    setIsLoading(false);
  };

  const getResourceDetail = async (resourceId: string) => {
    setIsLoading(true);
    const { data: newRes, error } = await getClient().getResourceDetail({
      query: {
        resourceId,
      },
    });

    if (error) {
      message.error(t('contentDetail.list.fetchErr'));
    }

    setContent(newRes?.data?.content);
    setIsLoading(false);
  };

  useEffect(() => {
    if (item.type === 'canvas') {
      getCanvasDetail(item.id);
    } else if (item.type === 'resource') {
      getResourceDetail(item.id);
    } else {
      setContent(item.data);
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
              <Button
                className="preview-action-btn"
                icon={<IconLink />}
                type="outline"
                size="mini"
                onClick={() => onOpenUrl(item.url)}
              >
                {t('common.open')}
              </Button>
              {!canNotRemove && (
                <Button
                  className="preview-action-btn"
                  icon={<IconDelete />}
                  type="outline"
                  size="mini"
                  onClick={() => onRemove && onRemove(item.id)}
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
