import { useState } from 'react';

// components
import { InvocationFormItems } from '@refly-packages/ai-workspace-common/components/skill/invocation-form-items';
import { TemplateConfigFormItems } from '@refly-packages/ai-workspace-common/components/skill/template-config-form-items';
import { useTranslation } from 'react-i18next';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { SkillInstance } from '@refly/openapi-schema';
import { Collapse, Modal, Form, Message } from '@arco-design/web-react';

// styles
import './index.scss';

const CollapseItem = Collapse.Item;

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
  const { invocationConfig = {}, tplConfigSchema, tplConfig } = data ?? {};
  const { input, context } = invocationConfig;
  const { t } = useTranslation();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const onOk = () => {
    form.validate().then(async (res) => {
      const { input, context, tplConfig } = res;
      const { contentList, urls } = context;

      setConfirmLoading(true);
      try {
        const { error: resultError } = await getClient().invokeSkill({
          body: {
            skillId: data.skillId,
            input,
            context: {
              ...context,
              contentList: contentList?.split(/\n\s*\n/),
              urls: urls?.split(/\n\s*\n/),
            },
            tplConfig,
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
      style={{ width: 750 }}
      visible={visible}
      onOk={onOk}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      confirmLoading={confirmLoading}
      onCancel={() => setVisible(false)}
    >
      <Form {...formItemLayout} form={form} className="instance-invoke-modal-container">
        {input?.rules?.length > 0 && (
          <InvocationFormItems
            headerTitle={t('common.input')}
            ruleGroup={data?.invocationConfig.input}
            form={form}
            t={t}
            fieldPrefix="input"
          />
        )}

        {context?.rules?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <InvocationFormItems
              headerTitle={t('common.context')}
              ruleGroup={data?.invocationConfig.context}
              form={form}
              t={t}
              fieldPrefix="context"
            />
          </div>
        )}

        {tplConfigSchema?.items?.length > 0 && (
          <TemplateConfigFormItems
            headerTitle={t('common.templateConfig')}
            schema={tplConfigSchema}
            form={form}
            tplConfig={tplConfig}
            fieldPrefix="tplConfig"
          />
        )}
      </Form>
    </Modal>
  );
};
