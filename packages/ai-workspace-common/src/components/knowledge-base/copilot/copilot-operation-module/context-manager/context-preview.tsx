import React from 'react';
import { Button } from '@arco-design/web-react';
import { IconClose, IconDelete, IconLink } from '@arco-design/web-react/icon';
import { Mark } from '@refly/common-types';

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
            打开
          </Button>
          <Button
            className="preview-action-btn"
            icon={<IconDelete />}
            type="outline"
            size="mini"
            onClick={() => onRemove(item.id)}
          >
            删除
          </Button>
          <Button className="preview-action-btn" icon={<IconClose />} type="outline" size="mini" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
      <div className="preview-content">
        <p>{item?.data || ''}</p>
      </div>
    </div>
  );
};
