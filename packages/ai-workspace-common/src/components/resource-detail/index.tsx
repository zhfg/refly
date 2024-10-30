import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { useParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Splitter, Button } from 'antd';
import { ResourceView } from '@refly-packages/ai-workspace-common/components/project-detail/resource-view';
import { ResourceProvider } from './context-provider';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/copilot';
import { useResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/resource';
import { ResourceDirectory } from './directory';

import { MdOutlineArrowBackIos } from 'react-icons/md';
import { HiOutlineSearch } from 'react-icons/hi';

import './index.scss';

export const ResourceDetail2 = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resId: resourceId } = useParams();

  const resourceStore = useResourceStoreShallow((state) => ({
    resource: state.resource.data,
    fetchReferences: state.fetchReferences,
  }));

  const searchStore = useSearchStoreShallow((state) => ({
    pages: state.pages,
    isSearchOpen: state.isSearchOpen,
    setPages: state.setPages,
    setIsSearchOpen: state.setIsSearchOpen,
  }));

  const ContentTop = () => {
    return (
      <div className="w-full pt-2 relative flex items-center resource-detail-top text-[#6F6F6F]">
        <div
          className="pl-3 flex items-center whitespace-nowrap cursor-pointer"
          onClick={() => {
            navigate('/library?tab=resource');
          }}
        >
          {' '}
          <MdOutlineArrowBackIos style={{ marginRight: 6, fontSize: 18 }} /> {t('resourceDetail.back')}
        </div>

        <div className="flex flex-grow justify-center items-center text-[16px]">
          {resourceStore.resource?.title}
          <Button
            className="ml-1"
            type="text"
            shape="circle"
            icon={<HiOutlineSearch />}
            onClick={() => {
              searchStore.setPages(searchStore.pages.concat('readResources'));
              searchStore.setIsSearchOpen(true);
            }}
          ></Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (resourceId) {
      resourceStore.fetchReferences(resourceId);
    }
  }, [resourceId]);

  return (
    <ResourceProvider context={{ resourceId }}>
      <div className="h-full">
        <Splitter layout="horizontal" className="workspace-panel-container">
          <Splitter.Panel className="workspace-content-panel" defaultSize={300} min={300} collapsible>
            <ResourceDirectory resourceId={resourceId} />
          </Splitter.Panel>

          <Splitter.Panel min={400} className="workspace-content-panel" key="workspace-content-panel-content">
            <div className="h-full pt-[10px]">
              <ResourceView resourceId={resourceId} />
            </div>
          </Splitter.Panel>

          <Splitter.Panel
            collapsible
            className="workspace-content-panel"
            defaultSize={400}
            min={400}
            key="workspace-content-panel-copilot"
          >
            <AICopilot />
          </Splitter.Panel>
        </Splitter>
      </div>
    </ResourceProvider>
  );
};
