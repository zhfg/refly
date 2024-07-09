import { useEffect } from 'react';
import { Message as message } from '@arco-design/web-react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

export const useSkillManagement = ({ shouldInit = false }: { shouldInit: boolean } = { shouldInit: false }) => {
  const skillStore = useSkillStore();

  const handleGetSkillInstances = async () => {
    const { data, error } = await getClient().listSkillInstances();

    if (data?.data) {
      console.log('skill instances', data?.data);
      skillStore.setSkillInstalces(data?.data);
    } else {
      console.log('get skill instances error', error);
    }
  };

  const handleGetSkillTemplates = async () => {
    const { data, error } = await getClient().listSkillTemplates();

    if (data?.data) {
      console.log('skill templates', data?.data);
      skillStore.setSkillTemplates(data?.data);
    } else {
      console.log('get skill templates error', error);
    }
  };

  const handleAddSkillInstance = async (skillTemplateName: string) => {
    const { skillTemplates } = useSkillStore.getState();
    const { localSettings } = useUserStore.getState();
    const skillInstanceMeta = skillTemplates.find((item) => item.name === skillTemplateName);

    if (!skillInstanceMeta) return;

    message.loading({
      content: '正在添加技能...',
      duration: 1000,
    });

    try {
      const { data } = await getClient().createSkillInstance({
        body: {
          instanceList: [
            {
              skillName: skillInstanceMeta.name,
              displayName: skillInstanceMeta?.displayName?.[localSettings?.uiLocale] as string,
            },
          ],
        },
      });

      if (data?.success) {
        handleGetSkillInstances(); // 重新获取技能事例
        message.success('技能添加成功');
      }
    } catch (err) {
      console.log('add skill instance error', err);
      message.error('技能添加失败');
    }
  };

  const handleRemoveSkillInstance = async (skillName: string) => {
    const { skillInstances = [] } = useSkillStore.getState();
    const skill = skillInstances.find((item) => item?.skillName === skillName);
    if (!skill?.skillId) return;

    message.loading({
      content: '正在移除技能...',
      duration: 1000,
    });
    try {
      const { data } = await getClient().deleteSkillInstance({
        body: {
          skillId: skill?.skillId,
        },
      });

      if (data?.success) {
        handleGetSkillInstances(); // 重新获取技能事例
        message.success('技能移除成功');
      }
    } catch (err) {
      console.log('remove skill instance error', err);
      message.error('技能移除失败');
    }

    const newSkillInstances = skillInstances.filter((item) => item?.skillName !== skillName);
    skillStore.setSkillInstalces(newSkillInstances);
  };

  useEffect(() => {
    if (shouldInit) {
      handleGetSkillTemplates();
      handleGetSkillInstances();
    }
  }, [shouldInit]);

  return {
    handleGetSkillInstances,
    handleGetSkillTemplates,
    handleAddSkillInstance,
    handleRemoveSkillInstance,
  };
};
