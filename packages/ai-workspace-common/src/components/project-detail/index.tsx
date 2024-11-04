import { Splitter, notification } from 'antd';
import { useParams } from '@refly-packages/ai-workspace-common/utils/router';

import { ContentArea } from './content-area';
import { ProjectDirectory } from './directory';
import { ProjectProvider } from './context-provider';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/copilot';
import { useProjectStore, useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';

import './index.scss';
import { useEffect } from 'react';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useProjectTabs } from '@refly-packages/ai-workspace-common/hooks/use-project-tabs';

export const ProjectDetail = () => {
  const { projectId } = useParams();

  const { setCurrentProjectId, fetchProjectAll } = useProjectStoreShallow((state) => ({
    setCurrentProjectId: state.setCurrentProjectId,
    fetchProjectAll: state.fetchProjectAll,
  }));

  const { jumpToCanvas, jumpToResource } = useJumpNewPath();
  const { tabsMap, activeTabMap, handleAddTab } = useProjectTabs();
  const tabs = tabsMap[projectId] || [];
  const activeTab = tabs.find((x) => x.key === activeTabMap[projectId]);

  const setInitialTab = async () => {
    const currentCanvases = useProjectStore.getState().canvases.data;
    const currentResources = useProjectStore.getState().resources.data;

    if (currentCanvases?.length) {
      const item = currentCanvases[0];
      jumpToCanvas({
        canvasId: item.id,
        projectId: projectId,
      });
      handleAddTab({
        projectId: projectId,
        key: item.id,
        title: item.title,
        type: 'canvas',
      });
    } else if (currentResources?.length) {
      const item = currentResources[0];
      jumpToResource({
        resId: item.id,
        projectId: projectId,
      });
      handleAddTab({
        projectId: projectId,
        key: item.id,
        title: item.title,
        type: 'resource',
      });
    }
  };

  useEffect(() => {
    const initProject = async () => {
      if (projectId) {
        setCurrentProjectId(projectId);
        await fetchProjectAll(projectId);

        if (!activeTab || activeTab?.projectId !== projectId) {
          setInitialTab();
        }
      }
    };

    initProject();
  }, [projectId]);

  return (
    <ProjectProvider context={{ projectId }}>
      <div className="project-detail-container">
        <Splitter layout="horizontal" className="workspace-panel-container">
          <Splitter.Panel
            collapsible
            defaultSize={300}
            min={300}
            className="workspace-left-assist-panel"
            key="workspace-left-assist-panel"
          >
            <ProjectDirectory projectId={projectId} />
          </Splitter.Panel>
          <Splitter.Panel min={450} className="workspace-content-panel" key="workspace-content-panel-content">
            <ContentArea projectId={projectId} />
          </Splitter.Panel>
          <Splitter.Panel
            collapsible
            className="workspace-content-panel"
            defaultSize={500}
            min={400}
            key="workspace-content-panel-copilot"
          >
            <AICopilot source={MessageIntentSource.Project} />
          </Splitter.Panel>
        </Splitter>
      </div>
    </ProjectProvider>
  );
};
