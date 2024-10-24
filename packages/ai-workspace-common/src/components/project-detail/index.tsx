import { Splitter, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { ContentArea } from './content-area';
import { ProjectDirectory } from './directory';
import { ProjectProvider } from './context-provider';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/copilot';
import { useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';

import './index.scss';
import { useEffect } from 'react';

export const ProjectDetail = () => {
  const { t } = useTranslation();
  const { projectId } = useParams();

  const { setCurrentProject, setIsFetching } = useProjectStoreShallow((state) => ({
    setCurrentProject: state.setCurrentProject,
    setIsFetching: state.setIsFetching,
  }));

  const handleGetDetail = async (projectId: string) => {
    setIsFetching(true);
    const { data: newRes, error } = await getClient().getProjectDetail({
      query: {
        projectId,
      },
    });
    setIsFetching(false);

    if (error || !newRes?.success) {
      notification.error({
        message: t('contentDetail.list.fetchErr'),
      });
      return;
    }
    if (!newRes?.success) {
      throw new Error(newRes?.errMsg);
    }

    if (newRes.data) {
      setCurrentProject(newRes.data);
    }
  };

  useEffect(() => {
    if (projectId) {
      handleGetDetail(projectId);
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
