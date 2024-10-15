import React from 'react';
import { Button } from '@arco-design/web-react';
import { IconClose, IconDelete, IconLink } from '@arco-design/web-react/icon';
import { Mark } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';

export const ContextPreview = ({
  item,
  onClose,
  onRemove,
  onOpenUrl,
}: {
  item: Mark;
  onClose: () => void;
  onRemove: (id: string) => void;
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
          <Button
            className="preview-action-btn"
            icon={<IconDelete />}
            type="outline"
            size="mini"
            onClick={() => onRemove(item.id)}
          >
            {t('common.delete')}
          </Button>
          <Button className="preview-action-btn" icon={<IconClose />} type="outline" size="mini" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
      <div className="preview-content">
        <Markdown content={item?.data || ''} />
      </div>
    </div>
  );
};
