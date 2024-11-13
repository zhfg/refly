import { useEffect } from 'react';
import { useRecentsStoreShallow } from '@refly-packages/ai-workspace-common/stores/recents';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Project, Conversation } from '@refly/openapi-schema';

const RECENT_NUM = 10;

export const useHandleRecents = (getRecents: boolean = false) => {
  const { recentProjects, recentConversations, updateRecentProjects, updateRecentConversations } =
    useRecentsStoreShallow((state) => ({
      recentProjects: state.recentProjects,
      recentConversations: state.recentConversations,
      updateRecentProjects: state.setRecentProjects,
      updateRecentConversations: state.setRecentConversations,
    }));

  const getRecentProjects = async () => {
    const { data: res, error } = await getClient().listProjects({
      query: { page: 1, pageSize: RECENT_NUM },
    });
    if (error) {
      console.error('getRecentProjects error', error);
      return;
    }
    const projects = res?.data || [];
    updateRecentProjects(projects);
    console.log('recentProjects', recentProjects);
  };

  const getRecentConversations = async () => {
    const { data: res, error } = await getClient().listConversations({
      query: { page: 1, pageSize: RECENT_NUM },
    });
    if (error) {
      console.error('getRecentConversations error', error);
      return;
    }
    const conversations = res?.data || [];
    updateRecentConversations(conversations);
  };

  const addRecentProject = (project: Project) => {
    const inRecent = recentProjects.find((p) => p.projectId === project.projectId);
    if (inRecent) {
      updateRecentProject(project);
    } else {
      const newRecentProjects = [project, ...recentProjects].slice(0, RECENT_NUM);
      updateRecentProjects(newRecentProjects);
    }
  };

  const deleteRecentProject = (projectId: string) => {
    const inRecent = recentProjects.find((project) => project.projectId === projectId);
    if (inRecent) {
      getRecentProjects();
    }
  };

  const updateRecentProject = (project: Project) => {
    const newRecentProjects = recentProjects.map((p) => (p.projectId === project.projectId ? project : p));
    updateRecentProjects([...newRecentProjects]);
  };

  const addRecentConversation = (conversation: Conversation) => {
    const newRecentConversations = [conversation, ...recentConversations].slice(0, RECENT_NUM);
    updateRecentConversations(newRecentConversations);
  };

  useEffect(() => {
    if (getRecents) {
      getRecentProjects();
    }
  }, [getRecents]);

  return {
    getRecentProjects,
    addRecentProject,
    deleteRecentProject,
    addRecentConversation,
  };
};
