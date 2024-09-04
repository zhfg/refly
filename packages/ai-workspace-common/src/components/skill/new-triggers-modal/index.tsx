import { useState, useEffect } from 'react';

// components
import { useCreateTrigger } from '@refly-packages/ai-workspace-common/hooks/use-create-trigger';
import { useImportNewTriggerModal } from '@refly-packages/ai-workspace-common/stores/import-new-trigger-modal';
import { InvocationFormItems } from '@refly-packages/ai-workspace-common/components/skill/invocation-form-items';
import { useTranslation } from 'react-i18next';

import { SkillInstance } from '@refly/openapi-schema';

import { Collapse, Modal, Form, Input, Message, Select, DatePicker } from '@arco-design/web-react';
import { TemplateConfigFormItems } from '@refly-packages/ai-workspace-common/components/skill/template-config-form-items';
import { TriggerConfigFormItems } from '@refly-packages/ai-workspace-common/components/skill/trigger-config-form-items';

import { BiBookContent } from 'react-icons/bi';
import { LuFormInput } from 'react-icons/lu';
import { FaWpforms } from 'react-icons/fa';

const CollapseItem = Collapse.Item;
const FormItem = Form.Item;
const Option = Select.Option;

const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

interface NewTriggersModalProps {
  data: SkillInstance;
}

export const NewTriggersModal = (props: NewTriggersModalProps) => {
  const importNewTriggerModal = useImportNewTriggerModal();
  const createTrigger = useCreateTrigger();
  const { data } = props;
  const { t } = useTranslation();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const [_triggerType, setTriggerType] = useState('');

  const onOk = () => {
    form.validate().then(async (res) => {
      const { contentList, urls } = res?.context || {};
      const qrams = {
        ...res,
        context: {
          ...res?.context,
          contentList: contentList?.split(/\n\s*\n/),
          urls: urls?.split(/\n\s*\n/),
        },
      };
      setConfirmLoading(true);
      let resultError: unknown;
      try {
        if (!importNewTriggerModal.trigger) {
          const error = await createTrigger.createTrigger({ ...qrams, skillId: data.skillId });
          resultError = error;
        } else {
          const error = await createTrigger.updateTrigger({
            ...qrams,
            triggerId: importNewTriggerModal.trigger.triggerId,
          });
          resultError = error;
        }
      } catch (error) {
        console.log(error);
      }
      setConfirmLoading(false);
      importNewTriggerModal.setShowtriggerModall(false);
      if (resultError) {
        console.error(resultError);
        Message.error({ content: t('common.putErr') });
      } else {
        Message.success({ content: t('common.putSuccess') });
        importNewTriggerModal.setReloadTriggerList(true);
      }
    });
  };

  useEffect(() => {
    if (!importNewTriggerModal.showtriggerModal) {
      setTriggerType('');
      importNewTriggerModal.setTrigger(null);
      form.clearFields();
    } else {
      if (importNewTriggerModal.trigger) {
        const trigger = importNewTriggerModal.trigger;
        console.log('importNewTriggerModal.trigger', trigger);
        const { context } = trigger;

        const formValue = {
          ...trigger,
          context: {
            ...context,
            contentList: context?.contentList?.join('\n'),
            urls: context?.urls?.join('\n'),
          },
        };

        // if (!('urls' in context)) {
        //   delete formValue.context.urls;
        // }
        // if (!('contentList' in context)) {
        //   delete formValue.context.contentList;
        // }
        console.log('formValue', formValue);

        form.setFieldsValue(formValue);
        setTriggerType(importNewTriggerModal.trigger.triggerType);
      }
    }
  }, [importNewTriggerModal.showtriggerModal]);

  return (
    <Modal
      title={t(`skill.newTriggerModal.${importNewTriggerModal.trigger ? 'update' : 'new'}Title`)}
      style={{ width: 700 }}
      visible={importNewTriggerModal.showtriggerModal}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      onOk={onOk}
      confirmLoading={confirmLoading}
      onCancel={() => importNewTriggerModal.setShowtriggerModall(false)}
    >
      <Form {...formItemLayout} form={form}>
        <TriggerConfigFormItems
          headerTitle={t('skill.newTriggerModal.triggerConfig')}
          _triggerType={_triggerType as 'timer' | 'simpleEvent'}
          setTriggerType={setTriggerType}
        />

        <InvocationFormItems
          headerTitle={t('common.input')}
          headerIcon={<LuFormInput />}
          ruleGroup={data?.invocationConfig.input}
          form={form}
          t={t}
          fieldPrefix="input"
        />

        <InvocationFormItems
          headerTitle={t('common.context')}
          headerIcon={<BiBookContent />}
          selectTooltipTitle={t('common.selectContext')}
          ruleGroup={data?.invocationConfig.context}
          form={form}
          t={t}
          fieldPrefix="context"
        />

        <TemplateConfigFormItems
          headerTitle={t('common.templateConfig')}
          headerIcon={<FaWpforms />}
          schema={data?.tplConfigSchema}
          form={form}
          tplConfig={data?.tplConfig}
          fieldPrefix="tplConfig"
        />
      </Form>
    </Modal>
  );
};
