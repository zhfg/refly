import { useState, useEffect } from 'react';

// components
import { useTranslation } from 'react-i18next';
import { SearchSelect } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';

import { Modal, Form, Message, Button } from '@arco-design/web-react';
const FormItem = Form.Item;

type domain = 'resource' | 'project';

interface BindResourceModalProps {
  domain: domain;
  projectId?: string;
  resourceId?: string;
  mode?: 'multiple';
  visible: boolean;
  setVisible: (val: boolean) => void;
  postConfirmCallback?: (value: string | string[] | null) => void;
}

export const BindResourceModal = (props: BindResourceModalProps) => {
  const { domain, projectId, resourceId, mode, visible, setVisible, postConfirmCallback } = props;
  const { t } = useTranslation();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const { setImportResourceModalVisible } = useImportResourceStore((state) => ({
    setImportResourceModalVisible: state.setImportResourceModalVisible,
  }));

  const onOk = () => {
    form.validate().then(async (res) => {
      setConfirmLoading(true);
      const { error } = await getClient().bindProjectResources({
        body:
          domain === 'resource'
            ? res.selectedValue.map((item) => ({
                projectId,
                resourceId: item,
                operation: 'bind',
              }))
            : [{ resourceId, projectId: res.selectedValue, operation: 'bind' }],
      });
      setConfirmLoading(false);

      if (error) {
        return;
      }

      setVisible(false);
      Message.success({ content: t('common.putSuccess') });
      if (postConfirmCallback) {
        postConfirmCallback(res.selectedValue);
      }
    });
  };

  useEffect(() => {
    if (visible) {
      form.clearFields();
    }
  }, [visible]);

  const formItemLayout = {
    labelCol: {
      span: 4,
    },
    wrapperCol: {
      span: 20,
    },
  };

  return (
    <Modal
      title={t(`knowledgeBase.resourceCollectionAssociativeModal.${domain}Title`)}
      style={{ width: 650 }}
      visible={visible}
      okText={t(`common.confirm`)}
      cancelText={t(`common.cancel`)}
      onOk={onOk}
      confirmLoading={confirmLoading}
      onCancel={() => setVisible(false)}
    >
      <Form {...formItemLayout} form={form}>
        <FormItem
          label={t(`knowledgeBase.resourceCollectionAssociativeModal.${domain}`)}
          required
          field="selectedValue"
          rules={[
            { required: true, message: t(`knowledgeBase.resourceCollectionAssociativeModal.${domain}Placeholder`) },
          ]}
        >
          <SearchSelect
            domain={domain}
            mode={mode}
            allowCreateNewEntity={domain === 'project'}
            placeholder={t(`knowledgeBase.resourceCollectionAssociativeModal.${domain}Placeholder`)}
            onChange={(val) => {
              form.setFieldValue('selectedValue', val);
            }}
          />
        </FormItem>
        {domain === 'resource' && (
          <FormItem label=" ">
            <Button
              type="outline"
              size="mini"
              onClick={() => {
                setImportResourceModalVisible(true);
                setVisible(false);
              }}
            >
              {t('knowledgeBase.resourceCollectionAssociativeModal.importResource')}
            </Button>
          </FormItem>
        )}
      </Form>
    </Modal>
  );
};
