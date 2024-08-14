import { useState, useEffect } from 'react';

// components
import { MultiSelect } from '../multi-select';
import { useTranslation } from 'react-i18next';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { SkillInstance } from '@refly/openapi-schema';

import { Modal, Form, Input, Message } from '@arco-design/web-react';
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
export const InstanceInvokeModal = (props: InstanceInvokeModalProps) => {
  const { visible, data, setVisible, postConfirmCallback } = props;
  const { t } = useTranslation();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [linkStr, setLinkStr] = useState('');
  const [form] = Form.useForm();

  const optionItems = [
    {
      name: 'resource',
      required: true,
      rules: [
        {
          type: 'array',
          minLength: 1,
          message: t('skill.instanceInvokeModal.select', {
            name: t(`skill.instanceInvokeModal.resource`),
          }),
        },
      ],
    },
    {
      name: 'note',
      required: false,
      rules: null,
    },
    {
      name: 'collection',
      required: false,
      rules: null,
    },
  ];
  const onOk = () => {
    form.validate().then(async (res) => {
      const { query, resourceIds, noteIds, collectionIds } = res;
      setConfirmLoading(true);
      try {
        const { error: resultError } = await getClient().invokeSkill({
          body: {
            skillId: data.skillId,
            input: { query },
            context: { resourceIds, noteIds, collectionIds, urls: [] },
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
      confirmLoading={confirmLoading}
      onCancel={() => setVisible(false)}
    >
      <Form
        {...formItemLayout}
        form={form}
        initialValues={{
          resourceIds: [],
          noteIds: [],
          collectionIds: [],
        }}
        labelCol={{
          style: { flexBasis: 90 },
        }}
        wrapperCol={{
          style: { flexBasis: 'calc(100% - 90px)' },
        }}
      >
        <FormItem
          label={t('skill.instanceInvokeModal.question')}
          required
          field="query"
          rules={[
            {
              required: true,
              message: t('skill.instanceInvokeModal.input', { name: t('skill.instanceInvokeModal.question') }),
            },
          ]}
        >
          <Input
            placeholder={t('skill.instanceInvokeModal.input', {
              name: t('skill.instanceInvokeModal.question'),
            })}
            maxLength={50}
            showWordLimit
          />
        </FormItem>

        {optionItems.map(({ name, required, rules }) => {
          return (
            <FormItem
              key={name}
              required={required}
              rules={rules}
              field={name + 'Ids'}
              label={t(`skill.instanceInvokeModal.${name}`)}
            >
              <MultiSelect
                type={name}
                placeholder={t('skill.instanceInvokeModal.select', {
                  name: t(`skill.instanceInvokeModal.${name}`),
                })}
                onValueChange={(val) => {
                  form.setFieldValue(name + 'Ids', val);
                }}
              />
            </FormItem>
          );
        })}

        <FormItem label={t('skill.newSkillModal.description')}>
          <TextArea
            placeholder={t('skill.instanceInvokeModal.inputUrl')}
            rows={4}
            autoSize={{
              minRows: 4,
              maxRows: 4,
            }}
            value={linkStr}
            onChange={(value) => setLinkStr(value)}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};
