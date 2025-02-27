import { useEffect } from 'react';
import { Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDuplicateCanvas } from '@refly-packages/ai-workspace-common/hooks/use-duplicate-canvas';
interface DuplicateCanvasModalProps {
  canvasId: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}
export const DuplicateCanvasModal = ({
  canvasId,
  visible,
  setVisible,
}: DuplicateCanvasModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { duplicateCanvas, loading } = useDuplicateCanvas();

  const onSubmit = () => {
    form.validateFields().then((values) => {
      const { title } = values;
      duplicateCanvas(canvasId, title, () => {
        setVisible(false);
      });
    });
  };

  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible]);

  return (
    <Modal
      centered
      open={visible}
      onCancel={() => setVisible(false)}
      onOk={onSubmit}
      confirmLoading={loading}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      title={t('template.duplicateCanvas')}
    >
      <div className="w-full h-full overflow-y-auto">
        <Form form={form}>
          <Form.Item
            required
            label={t('template.canvasTitle')}
            name="title"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder={t('template.duplicateCanvasTitlePlaceholder')} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
