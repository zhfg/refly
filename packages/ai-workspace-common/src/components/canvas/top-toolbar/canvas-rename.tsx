import { Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { Modal } from 'antd';
import { useEffect, useRef, useState } from 'react';
interface CanvasRenameProps {
  canvasTitle?: string;
  isModalOpen: boolean;
  handleModalOk: (editedTitle: string) => void;
  handleModalCancel: () => void;
}
export const CanvasRename: React.FC<CanvasRenameProps> = ({
  canvasTitle,
  isModalOpen,
  handleModalOk,
  handleModalCancel,
}) => {
  const { t } = useTranslation();
  const [editedTitle, setEditedTitle] = useState(canvasTitle);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isModalOpen) {
      setEditedTitle(canvasTitle);
    }
  }, [canvasTitle, isModalOpen]);

  return (
    <Modal
      centered
      title={t('canvas.toolbar.editTitle')}
      open={isModalOpen}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      onOk={() => handleModalOk(editedTitle)}
      onCancel={handleModalCancel}
      okButtonProps={{ disabled: !editedTitle?.trim() }}
      afterOpenChange={(open) => {
        if (open) {
          inputRef.current?.focus();
        }
      }}
    >
      <Input
        autoFocus
        ref={inputRef}
        value={editedTitle}
        onChange={(e) => setEditedTitle(e.target.value)}
        placeholder={t('canvas.toolbar.editTitlePlaceholder')}
        onKeyDown={(e) => {
          if (e.keyCode === 13 && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (editedTitle?.trim()) {
              handleModalOk(editedTitle);
            }
          }
        }}
      />
    </Modal>
  );
};
