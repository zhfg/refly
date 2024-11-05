import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { useParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import ResourceDeck from '@refly-packages/ai-workspace-common/components/project-detail/resource-view/resource-deck';
import { Splitter, Button } from 'antd';
import { ResourceView } from '@refly-packages/ai-workspace-common/components/project-detail/resource-view';
import { ResourceProvider } from './context-provider';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/copilot';
import { useResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/resource';
import { useReferencesStoreShallow } from '@refly-packages/ai-workspace-common/stores/references';
import { ResourceDirectory } from './directory';

import { MdOutlineArrowBackIos } from 'react-icons/md';
import { HiOutlineSearch } from 'react-icons/hi';

import './index.scss';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

export const ResourceDetail2 = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resId: resourceId } = useParams();

  const { copilotSize, resource, setCopilotSize } = useResourceStoreShallow((state) => ({
    copilotSize: state.copilotSize,
    resource: state.resource.data,
    setCopilotSize: state.setCopilotSize,
  }));

  const searchStore = useSearchStoreShallow((state) => ({
    pages: state.pages,
    isSearchOpen: state.isSearchOpen,
    setPages: state.setPages,
    setIsSearchOpen: state.setIsSearchOpen,
  }));

  const { deckSize, setDeckSize } = useReferencesStoreShallow((state) => ({
    deckSize: state.deckSize,
    setDeckSize: state.setDeckSize,
  }));

  useEffect(() => {
    return () => {
      setCopilotSize(400);
    };
  }, []);

  return (
    <ResourceProvider context={{ resourceId }}>
      <div className="h-full w-full overflow-hidden">
        <Splitter
          layout="horizontal"
          className="workspace-panel-container"
          onResize={(sizes) => setCopilotSize(sizes[2])}
        >
          <Splitter.Panel className="workspace-content-panel" defaultSize={300} min={300} max={400} collapsible>
            <ResourceDirectory resourceId={resourceId} />
          </Splitter.Panel>

          <Splitter.Panel min={400} className="workspace-content-panel" key="workspace-content-panel-content">
            <Splitter layout="vertical" onResize={(sizes) => setDeckSize(sizes[1])}>
              <Splitter.Panel>
                <ResourceView resourceId={resourceId} />
              </Splitter.Panel>
              <Splitter.Panel size={deckSize} max={'80%'} collapsible>
                <ResourceDeck domain="resource" id={resourceId} />
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>

          <Splitter.Panel
            collapsible
            className="workspace-content-panel"
            size={copilotSize}
            min={400}
            key="workspace-content-panel-copilot"
          >
            <AICopilot source={MessageIntentSource.Resource} />
          </Splitter.Panel>
        </Splitter>
      </div>
    </ResourceProvider>
  );
};
