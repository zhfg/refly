import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import { useParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useTranslation } from 'react-i18next';

import { Splitter, Button } from 'antd';
import { ContentArea } from '@refly-packages/ai-workspace-common/components/resource-detail/content-area';
import { ResourceProvider } from './context-provider';
import { AICopilot } from '@refly-packages/ai-workspace-common/components/copilot';
import { useResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/resource';
import { ResourceDirectory } from './directory';

import { MdOutlineArrowBackIos } from 'react-icons/md';
import { HiOutlineSearch } from 'react-icons/hi';

import './index.scss';

export const ResourceDetail2 = () => {
  const { t } = useTranslation();
  const { resId: resourceId } = useParams();

  const resourceStore = useResourceStoreShallow((state) => ({
    resource: state.resource.data,
    setCurrentResourceId: state.setCurrentResourceId,
    fetchResource: state.fetchResource,
  }));

  const searchStore = useSearchStoreShallow((state) => ({
    pages: state.pages,
    isSearchOpen: state.isSearchOpen,
    setPages: state.setPages,
    setIsSearchOpen: state.setIsSearchOpen,
  }));

  const ContentTop = () => {
    return (
      <div className="w-full h-11 relative flex justify-center items-center resource-detail-top text-[16px] text-[#6F6F6F]">
        <div
          className="absolute left-0 flex items-center cursor-pointer"
          onClick={() => {
            history.back();
          }}
        >
          {' '}
          <MdOutlineArrowBackIos style={{ marginRight: 10, fontSize: 18 }} /> 所有资源
        </div>
        <div className="flex items-center">
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
      resourceStore.setCurrentResourceId(resourceId);
      resourceStore.fetchResource(resourceId);
    }
  }, [resourceId]);

  return (
    <ResourceProvider context={{ resourceId }}>
      <div className="h-full">
        <Splitter layout="horizontal" className="workspace-panel-container">
          <Splitter.Panel
            defaultSize={600}
            min={300}
            className="workspace-left-assist-panel flex flex-col h-full"
            key="workspace-left-assist-panel"
          >
            <ContentTop />
            <Splitter layout="horizontal" className="flex-grow overflow-auto">
              <Splitter.Panel min={300} collapsible>
                <ResourceDirectory resourceId={resourceId} />
              </Splitter.Panel>
              <Splitter.Panel
                defaultSize={500}
                min={500}
                className="workspace-content-panel"
                key="workspace-content-panel-content"
              >
                <ContentArea resourceId={resourceId} />
              </Splitter.Panel>
            </Splitter>
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
