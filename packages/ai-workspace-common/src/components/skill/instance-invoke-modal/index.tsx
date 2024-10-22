import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { SkillInstance } from '@refly/openapi-schema';
import { Modal, Form, Message } from '@arco-design/web-react';

// styles
import './index.scss';

interface InstanceInvokeModalProps {
  data: SkillInstance;
  visible: boolean;
  setVisible: (val: boolean) => void;
  postConfirmCallback?: () => void;
}

export const InstanceInvokeModal = (props: InstanceInvokeModalProps) => {
  const { visible, data, setVisible, postConfirmCallback } = props;
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const onOk = async () => {
    try {
      const res = await form.validate();

      const { input, context, tplConfig } = res;
      const { contentList, urls } = context || {};

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
      setVisible(false);

      if (postConfirmCallback) {
        postConfirmCallback();
      }
    } catch (err) {
      Message.error({ content: t('common.putErr') });
    }
  };

  return (
    <Modal
      title={t('skill.instanceInvokeModal.title')}
      style={{ width: 750, height: `60vh` }}
      visible={visible}
      footer={null}
      className="instance-invoke-modal"
      onCancel={() => setVisible(false)}
    >
      <div className="instance-invoke-modal-content">
        {/* <InstanceInvokeForm
          onOk={onOk}
          form={form}
          data={data}
          setVisible={setVisible}
          postConfirmCallback={postConfirmCallback}
        /> */}
      </div>
    </Modal>
  );
};
