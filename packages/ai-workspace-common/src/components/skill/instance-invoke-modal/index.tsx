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
    const res = await form.validate();

    const { input, context, tplConfig } = res;
    const { contentList, urls } = context || {};

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
    setVisible(false);

    if (resultError) {
      return;
    }

    Message.success({ content: t('common.putSuccess') });

    if (postConfirmCallback) {
      postConfirmCallback();
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
