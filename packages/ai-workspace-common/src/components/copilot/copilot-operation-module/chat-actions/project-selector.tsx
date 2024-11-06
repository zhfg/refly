import { useState } from 'react';
import { Button, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconPlus } from '@arco-design/web-react/icon';
import { SearchSelect } from '@refly-packages/ai-workspace-common/modules/entity-selector/components/search-select';
import { IconProject } from '@refly-packages/ai-workspace-common/components/common/icon';
import { ProjectInfo, useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';

export const ProjectSelector = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState<ProjectInfo>();

  const { setSelectedProject } = useChatStoreShallow((state) => ({
    setSelectedProject: state.setSelectedProject,
  }));

  const titleTruncated = project?.title?.length > 15;
  const title = titleTruncated ? `${project.title.slice(0, 15)}...` : project?.title;

  return (
    <>
      <Button
        type="dashed"
        size="small"
        className="text-xs gap-1"
        icon={project?.projectId ? <IconProject /> : <IconPlus />}
        onClick={() => setOpen(true)}
      >
        {project?.projectId ? title : t('common.project')}
      </Button>
      <Modal
        title={t('copilot.projectSelector.title')}
        open={open}
        centered
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onOk={() => {
          setOpen(false);
          if (project) {
            setSelectedProject(project);
          }
        }}
        onCancel={() => setOpen(false)}
      >
        <p className="text-sm text-gray-600 my-3">{t('copilot.projectSelector.tip')}</p>
        <SearchSelect
          className="w-full mb-3"
          domain="project"
          onChange={(projectId, option) => {
            const opt = Array.isArray(option) ? option[0] : option;
            setProject({ projectId, title: String(opt?.label || '') });
          }}
        />
      </Modal>
    </>
  );
};
