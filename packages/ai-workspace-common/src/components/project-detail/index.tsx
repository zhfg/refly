import { Splitter, notification } from 'antd';
import { useParams } from '@refly-packages/ai-workspace-common/utils/router';

import { ContentArea } from './content-area';
import { ProjectDirectory } from './directory';
import { ProjectProvider } from './context-provider';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/copilot';
import { useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';

import './index.scss';
import { useEffect } from 'react';

export const ProjectDetail = () => {
  const { projectId } = useParams();

  const projectStore = useProjectStoreShallow((state) => ({
    setCurrentProjectId: state.setCurrentProjectId,
    fetchProjectAll: state.fetchProjectAll,
  }));

  useEffect(() => {
    if (projectId) {
      projectStore.setCurrentProjectId(projectId);
      projectStore.fetchProjectAll(projectId);
    }
  }, [projectId]);

  return (
    <ProjectProvider context={{ projectId }}>
      <div className="project-detail-container">
        <Splitter layout="horizontal" className="workspace-panel-container">
          <Splitter.Panel
            collapsible
            defaultSize={400}
            min={300}
            className="workspace-left-assist-panel"
            key="workspace-left-assist-panel"
          >
            <ProjectDirectory projectId={projectId} />
          </Splitter.Panel>
          <Splitter.Panel min={40} className="workspace-content-panel" key="workspace-content-panel-content">
            <ContentArea projectId={projectId} />
          </Splitter.Panel>
          <Splitter.Panel
            collapsible
            className="workspace-content-panel"
            defaultSize={500}
            min={400}
            key="workspace-content-panel-copilot"
          >
            <AICopilot />
          </Splitter.Panel>
        </Splitter>
      </div>
    </ProjectProvider>
  );
};
