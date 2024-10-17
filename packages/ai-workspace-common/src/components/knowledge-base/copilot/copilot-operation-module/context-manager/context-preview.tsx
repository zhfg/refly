import React from 'react';
import { Button, Empty } from '@arco-design/web-react';
import { IconClose, IconDelete, IconLink } from '@arco-design/web-react/icon';
import { Mark } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';

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

  return (
    <div className="context-preview">
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
        {item?.data ? <Markdown content={item?.data || ''} /> : <Empty description={t('common.empty')} />}
      </div>
    </div>
  );
};
