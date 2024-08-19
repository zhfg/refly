import { useState, useEffect } from 'react';

// components
import { useCreateTrigger } from '@refly-packages/ai-workspace-common/hooks/use-create-trigger';
import { useImportNewTriggerModal } from '@refly-packages/ai-workspace-common/stores/import-new-trigger-modal';
import { InvokeOptionComponent } from '@refly-packages/ai-workspace-common/components/skill/RuleOptionComponent';
import { useTranslation } from 'react-i18next';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { SkillInstance } from '@refly/openapi-schema';

import { Modal, Form, Input, Message, Select, DatePicker } from '@arco-design/web-react';
const FormItem = Form.Item;
const Option = Select.Option;

const formItemLayout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 20,
  },
};

const triggerType = ['timer', 'simpleEvent'];
const repeatInterval = ['hour', 'day', 'week', 'month', 'year'];

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

  const { inputRules = [], contextRules = [] } = data?.invocationConfig || {};
  const optionItems = [...inputRules, ...contextRules].map((rule) => ({
    key: rule.key,
    required: rule.required,
    formComp: InvokeOptionComponent({ rule, form, t }),
  }));

  const onOk = () => {
    form.validate().then(async (res) => {
      console.log('res', res);
      setConfirmLoading(true);
      let resultError: unknown;
      try {
        if (!importNewTriggerModal.trigger) {
          const error = await createTrigger.createTrigger({ ...res, skillId: data.skillId });
          resultError = error;
        } else {
          const error = await createTrigger.updateTrigger({
            ...res,
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
      importNewTriggerModal.setTrigger(null);
      form.clearFields();
    } else {
      if (importNewTriggerModal.trigger) {
        form.setFieldsValue(importNewTriggerModal.trigger);
        setTriggerType(importNewTriggerModal.trigger.triggerType);
      }
    }
  }, [importNewTriggerModal.showtriggerModal]);

  return (
    <Modal
      title={t(`skill.newTriggerModal.${importNewTriggerModal.trigger ? 'update' : 'new'}Title`)}
      visible={importNewTriggerModal.showtriggerModal}
      onOk={onOk}
      confirmLoading={confirmLoading}
      onCancel={() => importNewTriggerModal.setShowtriggerModall(false)}
    >
      <Form
        {...formItemLayout}
        form={form}
        labelCol={{
          style: { flexBasis: 90 },
        }}
        wrapperCol={{
          style: { flexBasis: 'calc(100% - 90px)' },
        }}
      >
        <FormItem
          label={t('skill.newTriggerModal.name')}
          required
          field="displayName"
          rules={[{ required: true, message: t('skill.newTriggerModal.namePlaceholder') }]}
        >
          <Input placeholder={t('skill.newTriggerModal.namePlaceholder')} maxLength={50} showWordLimit />
        </FormItem>

        <FormItem
          label={t('skill.newTriggerModal.triggerType')}
          required
          field="triggerType"
          rules={[{ required: true, message: t('skill.newTriggerModal.triggerTypePlaceholder') }]}
        >
          <Select
            size="large"
            placeholder={t('skill.newTriggerModal.triggerTypePlaceholder')}
            onChange={(value) => {
              setTriggerType(value);
            }}
          >
            {triggerType.map((item) => {
              return (
                <Option key={item} value={item}>
                  {t(`skill.newTriggerModal.${item}`)}
                </Option>
              );
            })}
          </Select>
        </FormItem>

        {_triggerType === 'timer' && (
          <>
            <FormItem
              label={t('skill.newTriggerModal.timerConfig')}
              required
              field="timerConfig.datetime"
              rules={[{ required: true, message: t('skill.newTriggerModal.timerConfigPlaceholder') }]}
            >
              <DatePicker
                showTime={{
                  defaultValue: '00:00:00',
                }}
                format="YYYY-MM-DD HH:mm:ss"
                placeholder={t('skill.newTriggerModal.timerConfigPlaceholder')}
              />
            </FormItem>

            <FormItem label={t('skill.newTriggerModal.repeatInterval')} field="timerConfig.repeatInterval">
              <Select allowClear size="large" placeholder={t('skill.newTriggerModal.repeatIntervalPlaceholder')}>
                {repeatInterval.map((item) => {
                  return (
                    <Option key={item} value={item}>
                      {t(`skill.newTriggerModal.${item}`)}
                    </Option>
                  );
                })}
              </Select>
            </FormItem>

            {optionItems.map(({ key, required, formComp }) => {
              return (
                <FormItem
                  label={t(`skill.instanceInvokeModal.formLabel.${key}`)}
                  key={key}
                  required={required}
                  field={key}
                >
                  {formComp}
                </FormItem>
              );
            })}
          </>
        )}

        {_triggerType === 'simpleEvent' && (
          <FormItem
            label={t('skill.newTriggerModal.event')}
            required
            field="simpleEventName"
            rules={[{ required: true, message: t('skill.newTriggerModal.eventPlaceholder') }]}
          >
            <Select size="large" placeholder={t('skill.newTriggerModal.eventPlaceholder')}>
              {['onResourceReady'].map((item) => {
                return (
                  <Option key={item} value={item}>
                    {t(`skill.newTriggerModal.${item}`)}
                  </Option>
                );
              })}
            </Select>
          </FormItem>
        )}
      </Form>
    </Modal>
  );
};
