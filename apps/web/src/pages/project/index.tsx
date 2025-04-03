import { Project } from '@refly-packages/ai-workspace-common/components/project';
import { useParams } from 'react-router-dom';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';
import { LibraryModal } from '@refly-packages/ai-workspace-common/components/workspace/library-modal';

const ProjectPage = () => {
  const { projectId = '' } = useParams();
  const { showLibraryModal, setShowLibraryModal } = useSiderStoreShallow((state) => ({
    showLibraryModal: state.showLibraryModal,
    setShowLibraryModal: state.setShowLibraryModal,
  }));

  return (
    <>
      <Project projectId={projectId} />
      <LibraryModal visible={showLibraryModal} setVisible={setShowLibraryModal} />
    </>
  );
};

export default ProjectPage;
