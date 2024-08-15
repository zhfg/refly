import { useState } from 'react';

// components
import { MultiSelect } from '../multi-select';
import { useTranslation } from 'react-i18next';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { SkillInstance, SkillInvocationRule } from '@refly/openapi-schema';
import { Modal, Form, Input, Message, FormInstance } from '@arco-design/web-react';
import { TFunction } from 'i18next';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

const formItemLayout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 20,
  },
};

interface InstanceInvokeModalProps {
  data: SkillInstance;
  visible: boolean;
  setVisible: (val: boolean) => void;
  postConfirmCallback?: () => void;
}

const InvokeOptionComponent = (props: {
  rule: SkillInvocationRule;
  form: FormInstance;
  t: TFunction;
}): React.ReactNode => {
  const { rule, form, t } = props;

  if (rule.key === 'query') {
    return <Input placeholder={t('skill.instanceInvokeModal.placeholder.query')} maxLength={100} showWordLimit />;
  }

  if (rule.key === 'resourceIds' || rule.key === 'noteIds' || rule.key === 'collectionIds') {
    return (
      <MultiSelect
        type={rule.key}
        placeholder={t(`skill.instanceInvokeModal.placeholder.${rule.key}`)}
        onValueChange={(val) => {
          form.setFieldValue(rule.key, val);
        }}
      />
    );
  }

  if (rule.key === 'contentList') {
    return (
      <TextArea
        placeholder={t('skill.instanceInvokeModal.placeholder.contentList')}
        rows={4}
        autoSize={{
          minRows: 4,
          maxRows: 10,
        }}
      />
    );
  }

  if (rule.key === 'urls') {
    return (
      <TextArea
        placeholder={t('skill.instanceInvokeModal.placeholder.urls')}
        rows={4}
        autoSize={{
          minRows: 4,
          maxRows: 10,
        }}
      />
    );
  }

  return null;
};

export const InstanceInvokeModal = (props: InstanceInvokeModalProps) => {
  const { visible, data, setVisible, postConfirmCallback } = props;
  const { t } = useTranslation();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const { inputRules = [], contextRules = [] } = data?.invocationConfig || {};
  const optionItems = [...inputRules, ...contextRules].map((rule) => ({
    key: rule.key,
    required: rule.required,
    formComp: InvokeOptionComponent({ rule, form, t }),
  }));

  const onOk = () => {
    form.validate().then(async (res) => {
      const { query, resourceIds, noteIds, collectionIds, contentList, urls } = res;
      setConfirmLoading(true);
      try {
        const { error: resultError } = await getClient().invokeSkill({
          body: {
            skillId: data.skillId,
            input: { query },
            context: {
              resourceIds,
              noteIds,
              collectionIds,
              contentList: contentList?.split(/\n\s*\n/),
              urls: urls?.split(/\n\s*\n/),
            },
          },
        });
        if (resultError) {
          Message.error({ content: t('common.putErr') });
        } else {
          Message.success({ content: t('common.putSuccess') });
        }
      } catch (error) {
        console.log(error);
        Message.error({ content: t('common.putErr') });
      }
      setConfirmLoading(false);
      setVisible(false);

      if (postConfirmCallback) {
        postConfirmCallback();
      }
    });
  };

  return (
    <Modal
      title={t('skill.instanceInvokeModal.title')}
      visible={visible}
      onOk={onOk}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      confirmLoading={confirmLoading}
      onCancel={() => setVisible(false)}
    >
      <Form
        {...formItemLayout}
        form={form}
        labelCol={{
          style: { flexBasis: 100 },
        }}
        wrapperCol={{
          style: { flexBasis: 'calc(100% - 100px)' },
        }}
      >
        {optionItems.map(({ key, required, formComp }) => {
          return (
            <FormItem label={t(`skill.instanceInvokeModal.formLabel.${key}`)} key={key} required={required} field={key}>
              {formComp}
            </FormItem>
          );
        })}
      </Form>
    </Modal>
  );
};
