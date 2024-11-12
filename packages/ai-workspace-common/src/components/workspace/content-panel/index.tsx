import { useRef, useState, useEffect } from 'react';
import { Affix, Radio, Dropdown, Menu, Modal } from '@arco-design/web-react';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ResourceList } from '@refly-packages/ai-workspace-common/components/workspace/resource-list';
import { CanvasList } from '@refly-packages/ai-workspace-common/components/workspace/canvas-list';
import { ProjectList } from '@refly-packages/ai-workspace-common/components/workspace/project-list';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { useImportProjectModal } from '@refly-packages/ai-workspace-common/stores/import-project-modal';
import { useNewCanvasModalStoreShallow } from '@refly-packages/ai-workspace-common/stores/new-canvas-modal';

import './index.scss';
import classNames from 'classnames';
import { useCanvasStore } from '@refly-packages/ai-workspace-common/stores/canvas';
import { IconLoading } from '@arco-design/web-react/icon';

const RadioGroup = Radio.Group;

const Content = (props: { val: string }) => {
  switch (props.val) {
    case 'resource':
      return <ResourceList />;
    case 'canvas':
      return <CanvasList />;
    case 'project':
      return <ProjectList />;
    default:
      return <ResourceList />;
  }
};

const NewFileDropList = (props: { handleCreateButtonClick: (type: string) => void }) => {
  const { t } = useTranslation();
  return (
    <Menu
      style={{
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0px 2px 6px 0px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
      }}
    >
      {['canvas', 'resource', 'project'].map((item) => {
        return (
          <Menu.Item key={item} onClick={() => props.handleCreateButtonClick(item)}>
            {t(`workspace.contentPanel.newButton.${item}`)}
          </Menu.Item>
        );
      })}
    </Menu>
  );
};

const NewFileButton = (props: { val: string }) => {
  const { t } = useTranslation();
  const importResourceStore = useImportResourceStore();
  const importProjectModal = useImportProjectModal();
  const { newNoteCreating } = useCanvasStore((state) => ({
    newNoteCreating: state.newCanvasCreating,
  }));
  const newCanvasModalStore = useNewCanvasModalStoreShallow((state) => ({
    setNewCanvasModalVisible: state.setNewCanvasModalVisible,
  }));

  const handleCreateButtonClick = (type: string) => {
    if (type === 'canvas' && !newNoteCreating) {
      newCanvasModalStore.setNewCanvasModalVisible(true);
    }
    if (type === 'resource') {
      importResourceStore.setImportResourceModalVisible(true);
    }
    if (type === 'project') {
      importProjectModal.setShowNewProjectModal(true);
      importProjectModal.setEditProject(null);
    }
  };

  return (
    <Dropdown.Button
      type="primary"
      droplist={<NewFileDropList handleCreateButtonClick={(type) => handleCreateButtonClick(type)} />}
      icon={newNoteCreating ? <IconLoading /> : <HiOutlineChevronDown />}
    >
      <div onClick={() => handleCreateButtonClick(props.val)}>{t(`workspace.contentPanel.newButton.${props.val}`)}</div>
    </Dropdown.Button>
  );
};

const ContentHeader = (props: { setVal: (val: string) => void; hitTop: boolean; val: string }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setVal, hitTop } = props;

  const handleTabChange = (key: string) => {
    setVal(key);
    navigate(`?tab=${key}`);
  };

  return (
    <div
      className={classNames(
        'content-panel-header',
        { 'content-panel-header-hit-top': hitTop },
        'flex justify-between items-center pt-3 pb-3 h-16',
      )}
    >
      <div className="flex items-center">
        <RadioGroup
          type="button"
          size="large"
          className="content-panel-radio-group"
          defaultValue="resource"
          value={props.val}
          onChange={(val) => handleTabChange(val)}
          style={{ borderRadius: 8 }}
        >
          <Radio value="canvas">{t('workspace.contentPanel.tabPanel.canvas')}</Radio>
          <Radio value="resource">{t('workspace.contentPanel.tabPanel.resource')}</Radio>
          <Radio value="project">{t('workspace.contentPanel.tabPanel.project')}</Radio>
        </RadioGroup>
      </div>

      <NewFileButton val={props.val}></NewFileButton>
    </div>
  );
};

export const ContentPanel = () => {
  const ref = useRef();
  const [val, setVal] = useState('canvas');
  const [hitTop, setHitTop] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    const tab = searchParams.get('tab') as string;
    setVal(tab || 'canvas');
  }, [searchParams]);

  return (
    <div className="content-panel-container" ref={ref}>
      <Affix offsetTop={0} target={() => ref.current} onChange={setHitTop}>
        <ContentHeader val={val} setVal={setVal} hitTop={hitTop} />
      </Affix>
      <Content val={val} />
    </div>
  );
};
