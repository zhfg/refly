import { useRef, useState, useEffect } from 'react';
import { Affix, Radio, Dropdown, Menu, Modal } from '@arco-design/web-react';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { WorkSpaceSearch } from '../work-space-search';
import { ResourceList } from '@refly-packages/ai-workspace-common/components/workspace/resource-list';
import { NoteList } from '@refly-packages/ai-workspace-common/components/workspace/note-list';
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';
import { SearchQuickOpenBtn } from '@refly-packages/ai-workspace-common/components/search-quick-open-btn';
import { useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { useImportKnowledgeModal } from '@refly-packages/ai-workspace-common/stores/import-knowledge-modal';
import { useAINote } from '@refly-packages/ai-workspace-common/hooks/use-ai-note';

import './index.scss';
import classNames from 'classnames';

const RadioGroup = Radio.Group;

const Content = (props: { val: string }) => {
  switch (props.val) {
    case 'resource':
      return <ResourceList />;
    case 'note':
      return <NoteList />;
    case 'collection':
      return <KnowledgeBaseList />;
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
      {['resource', 'note', 'collection'].map((item) => {
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
  const importKnowledgeModal = useImportKnowledgeModal();
  const { handleInitEmptyNote } = useAINote();

  const handleCreateButtonClick = (type: string) => {
    if (type === 'note') {
      handleInitEmptyNote('');
    }
    if (type === 'resource') {
      importResourceStore.setImportResourceModalVisible(true);
    }
    if (type === 'collection') {
      importKnowledgeModal.setShowNewKnowledgeModal(true);
      importKnowledgeModal.setEditCollection(null);
    }
  };

  return (
    <Dropdown.Button
      type="primary"
      droplist={<NewFileDropList handleCreateButtonClick={(type) => handleCreateButtonClick(type)} />}
      icon={<HiOutlineChevronDown />}
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
        'h-16 pt-3 pb-3 flex justify-between items-center',
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
          <Radio value="resource">{t('workspace.contentPanel.tabPanel.resource')}</Radio>
          <Radio value="note">{t('workspace.contentPanel.tabPanel.note')}</Radio>
          <Radio value="collection">{t('workspace.contentPanel.tabPanel.collection')}</Radio>
        </RadioGroup>
        {hitTop && (
          <SearchQuickOpenBtn
            className="work-space-top-search"
            placeholder="loggedHomePage.quickSearch.placeholderForHome"
          />
        )}
      </div>

      <NewFileButton val={props.val}></NewFileButton>
    </div>
  );
};

export const ContentPanel = () => {
  const ref = useRef();
  const [val, setVal] = useState('resource');
  const [hitTop, setHitTop] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    const tab = searchParams.get('tab') as string;
    setVal(tab || 'resource');
  }, [searchParams]);

  useEffect(() => {
    const paySuccess = searchParams.get('paySuccess');
    const payCancel = searchParams.get('payCancel');
    if (paySuccess || payCancel) {
      setTimeout(() => {
        const title = paySuccess ? t('settings.action.paySuccessNotify') : t('settings.action.payCancelNotify');
        const description = paySuccess
          ? t('settings.action.paySuccessDescription')
          : t('settings.action.payCancelDescription');
        if (paySuccess) {
          Modal.success({
            title,
            content: description,
          });
        } else {
          Modal.error({
            title,
            content: description,
          });
        }
        navigate('/', { replace: true });
      }, 1);
    }
  }, []);

  return (
    <div className="content-panel-container" ref={ref}>
      <WorkSpaceSearch />
      <Affix offsetTop={0} target={() => ref.current} onChange={setHitTop}>
        <ContentHeader val={val} setVal={setVal} hitTop={hitTop} />
      </Affix>
      <Content val={val} />
    </div>
  );
};
