import { Splitter } from 'antd';
import { useParams, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

import { ContentArea } from './content-area';
import { ProjectDirectory } from './directory';
import { ProjectProvider } from './context-provider';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/copilot';
import { useProjectStore, useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';

import './index.scss';
import { useEffect, useState } from 'react';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useProjectTabs } from '@refly-packages/ai-workspace-common/hooks/use-project-tabs';
import { BindResourceModal } from '@refly-packages/ai-workspace-common/components/project-detail/resource-view/resource-collection-associative-modal';

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const convId = searchParams.get('convId');
  const {
    setCurrentProjectId,
    fetchProjectAll,
    copilotSize,
    setCopilotSize,
    setProjectActiveConvId,
    fetchProjectDirItems,
  } = useProjectStoreShallow((state) => ({
    copilotSize: state.copilotSize,
    setCurrentProjectId: state.setCurrentProjectId,
    fetchProjectAll: state.fetchProjectAll,
    setCopilotSize: state.setCopilotSize,
    fetchProjectDetail: state.fetchProjectDetail,
    setProjectActiveConvId: state.setProjectActiveConvId,
    fetchProjectDirItems: state.fetchProjectDirItems,
  }));

  const { jumpToCanvas, jumpToResource } = useJumpNewPath();
  const { tabsMap, activeTabMap, handleAddTab } = useProjectTabs();
  const tabs = tabsMap[projectId] || [];
  const activeTab = tabs.find((x) => x.key === activeTabMap[projectId]);

  const [bindResourceModalVisible, setBindResourceModalVisible] = useState(false);

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

    return () => {
      setCopilotSize(500);
    };
  }, [projectId]);

  useEffect(() => {
    setProjectActiveConvId(projectId, convId);
  }, [projectId, convId]);

  useEffect(() => {
    const currentConversations = useProjectStore.getState().conversations.data;
    if (convId && !currentConversations.find((item) => item.id === convId)) {
      fetchProjectDirItems(projectId, 'conversations');
    }
  }, [convId]);

  return (
    <ProjectProvider context={{ projectId }}>
      <div className="project-detail-container">
        <Splitter
          layout="horizontal"
          className="workspace-panel-container"
          onResize={(size) => setCopilotSize(size[2])}
        >
          <Splitter.Panel
            collapsible
            defaultSize={300}
            min={300}
            className="workspace-left-assist-panel"
            key="workspace-left-assist-panel"
          >
            <ProjectDirectory projectId={projectId} setBindResourceModalVisible={setBindResourceModalVisible} />
          </Splitter.Panel>
          <Splitter.Panel min={450} className="workspace-content-panel" key="workspace-content-panel-content">
            <ContentArea projectId={projectId} setBindResourceModalVisible={setBindResourceModalVisible} />
          </Splitter.Panel>
          <Splitter.Panel
            collapsible
            className="workspace-content-panel"
            size={copilotSize}
            min={400}
            key="workspace-content-panel-copilot"
          >
            <AICopilot source={MessageIntentSource.Project} />
          </Splitter.Panel>
        </Splitter>
      </div>

      <BindResourceModal
        domain="resource"
        mode="multiple"
        projectId={projectId}
        visible={bindResourceModalVisible}
        setVisible={setBindResourceModalVisible}
        postConfirmCallback={async (value) => {
          await fetchProjectAll(projectId);
          const currentResources = useProjectStore.getState().resources.data;
          const openResource = currentResources.find((res) => res.id === value[0]);
          jumpToResource({
            resId: openResource.id,
            projectId: projectId,
          });
          handleAddTab({
            projectId: projectId,
            key: openResource.id,
            title: openResource.title,
            type: 'resource',
          });
        }}
      />
    </ProjectProvider>
  );
};
