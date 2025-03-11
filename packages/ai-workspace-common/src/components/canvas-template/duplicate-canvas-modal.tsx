import { useEffect, useState } from 'react';
import { Checkbox, Form, Input, Modal, message } from 'antd';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useNavigate } from 'react-router-dom';

interface DuplicateCanvasModalProps {
  canvasId: string;
  canvasName?: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const DuplicateCanvasModal = ({
  canvasId,
  canvasName,
  visible,
  setVisible,
}: DuplicateCanvasModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    form.validateFields().then(async (values) => {
      if (loading) return;
      setLoading(true);
      const { title, duplicateEntities } = values;
      const { data } = await getClient().duplicateCanvas({
        body: {
          canvasId,
          title,
          duplicateEntities,
        },
      });
      setLoading(false);

      if (data?.success && data?.data?.canvasId) {
        message.success(t('canvas.action.duplicateSuccess'));
        setVisible(false);
        navigate(`/canvas/${data.data.canvasId}`);
      }
    });
  };

  useEffect(() => {
    if (visible) {
      form.setFieldValue('duplicateEntities', false);
      form.setFieldValue('title', canvasName);
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

          <Form.Item
            className="ml-2.5"
            label={t('template.duplicateCanvasEntities')}
            name="duplicateEntities"
          >
            <Checkbox />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
