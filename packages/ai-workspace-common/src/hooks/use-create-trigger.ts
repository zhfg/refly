// components
import { Message } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

// requests
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SkillTrigger } from '@refly/openapi-schema';

export const useCreateTrigger = () => {
  const { t } = useTranslation();
  const updateTriggerStatus = async (trigger: SkillTrigger, val: boolean) => {
    const { error } = await getClient().updateSkillTrigger({
      body: { ...trigger, enabled: val },
    });
    if (error) {
      Message.error({ content: t('common.putErr') });
    } else {
      Message.success({ content: t('common.putSuccess') });
    }
    return error;
  };

  const updateTrigger = async (trigger: SkillTrigger) => {
    const { error } = await getClient().updateSkillTrigger({
      body: trigger,
    });
    return error;
  };

  const createTrigger = async (trigger: SkillTrigger) => {
    const { error } = await getClient().createSkillTrigger({
      body: {
        triggerList: [trigger],
      },
    });
    return error;
  };

  const deleteTrigger = async (trigger: SkillTrigger) => {
    const { error } = await getClient().deleteSkillTrigger({
      body: {
        triggerId: trigger.triggerId,
      },
    });
    if (error) {
      Message.error({ content: t('common.putErr') });
    } else {
      Message.success({ content: t('common.putSuccess') });
    }
    return error;
  };
  return {
    updateTriggerStatus,
    updateTrigger,
    createTrigger,
    deleteTrigger,
  };
};
