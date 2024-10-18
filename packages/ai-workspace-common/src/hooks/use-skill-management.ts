import { useEffect, useRef } from 'react';
import { Message as message } from '@arco-design/web-react';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useSkillStore, useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

export const useSkillManagement = ({ shouldInit = false }: { shouldInit: boolean } = { shouldInit: false }) => {
  const skillStore = useSkillStoreShallow((state) => ({
    setSkillInstances: state.setSkillInstances,
    setSkillTemplates: state.setSkillTemplates,
    setIsFetchingSkillInstances: state.setIsFetchingSkillInstances,
    setIsFetchingSkillTemplates: state.setIsFetchingSkillTemplates,
  }));

  const handleGetSkillInstances = async () => {
    const { userProfile } = useUserStore.getState();
    if (!userProfile?.uid) {
      return;
    }

    skillStore.setIsFetchingSkillInstances(true);
    const { data, error } = (await getClient().listSkillInstances({ query: { sortByPin: true } })) || {};

    if (data?.data) {
      console.log('skill instances', data?.data);
      skillStore.setSkillInstances(data?.data);
    } else {
      console.log('get skill instances error', error);
    }
    skillStore.setIsFetchingSkillInstances(false);
  };

  const handleGetSkillTemplates = async () => {
    skillStore.setIsFetchingSkillTemplates(true);
    const { data, error } = (await getClient().listSkillTemplates()) || {};

    if (data?.data) {
      console.log('skill templates', data?.data);
      skillStore.setSkillTemplates(data?.data);
    } else {
      console.log('get skill templates error', error);
    }
    skillStore.setIsFetchingSkillTemplates(false);
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
              tplName: skillInstanceMeta.name,
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

  return {
    handleGetSkillInstances,
    handleGetSkillTemplates,
    handleAddSkillInstance,
  };
};
