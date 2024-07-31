import { useRef, useState } from 'react';
import { Affix, Radio } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

import { WorkSpaceSearch } from '../work-space-search';
import { ResourceList } from '@refly-packages/ai-workspace-common/components/workspace/resource-list';
import { NoteList } from '@refly-packages/ai-workspace-common/components/workspace/note-list';
import { KnowledgeBaseList } from '@refly-packages/ai-workspace-common/components/knowledge-base-list';

import './index.scss';
import classNames from 'classnames';

const RadioGroup = Radio.Group;

const Content = (props: { val: string }) => {
  switch (props.val) {
    case 'knowledge-resource':
      return <ResourceList />;
    case 'knowledge-notes':
      return <NoteList />;
    case 'knowledge-collection':
      return <KnowledgeBaseList />;
    default:
      return <ResourceList />;
  }
};

const ContentHeader = (props: { setVal: (val: string) => void; hitTop: boolean }) => {
  const { t } = useTranslation();
  const { setVal, hitTop } = props;

  return (
    <div className={classNames('content-panel-header', { 'content-panel-header-hit-top': hitTop }, 'h-16 pt-3')}>
      <RadioGroup
        type="button"
        size="large"
        className="content-panel-radio-group"
        defaultValue="knowledge-resource"
        onChange={(val) => setVal(val)}
      >
        <Radio value="knowledge-resource">{t('workspace.contentPanel.tabPanel.resource')}</Radio>
        <Radio value="knowledge-notes">{t('workspace.contentPanel.tabPanel.note')}</Radio>
        <Radio value="knowledge-collection">{t('workspace.contentPanel.tabPanel.collection')}</Radio>
      </RadioGroup>
    </div>
  );
};

export const ContentPanel = () => {
  const ref = useRef();
  const [val, setVal] = useState('knowledge-resource');
  const [hitTop, setHitTop] = useState(false);

  return (
    <div className="content-panel-container" ref={ref}>
      <WorkSpaceSearch />
      <Affix offsetTop={0} target={() => ref.current} onChange={setHitTop}>
        <ContentHeader setVal={setVal} hitTop={hitTop} />
      </Affix>
      <Content val={val} />
    </div>
  );
};
