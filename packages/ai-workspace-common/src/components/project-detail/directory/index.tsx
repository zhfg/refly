import { useEffect, useState } from 'react';
import { LOCALE } from '@refly/common-types';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

import './index.scss';
import { Segmented, Skeleton } from 'antd';
import { Input } from '@arco-design/web-react';

import { useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';
import { useNewCanvasModalStoreShallow } from '@refly-packages/ai-workspace-common/stores/new-canvas-modal';

import { BindResourceModal } from '../resource-view/resource-collection-associative-modal';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/project-detail/delete-dropdown-menu';
import { useTranslation } from 'react-i18next';
import { HiOutlineSearch } from 'react-icons/hi';
import { HiOutlinePlus } from 'react-icons/hi2';
import { IconCanvas, IconProject, IconThread } from '@refly-packages/ai-workspace-common/components/common/icon';
import { Favicon } from '@refly-packages/ai-workspace-common/components/common/favicon';
import { useProjectTabs } from '@refly-packages/ai-workspace-common/hooks/use-project-tabs';

type DirectoryItemType = 'canvas' | 'resource' | 'thread';

interface DirectoryListItem {
  id: string;
  title: string;
  type: DirectoryItemType;
  url?: string;
}

export const ProjectDirectory = (props: { projectId: string; small?: boolean }) => {
  const { projectId, small } = props;

  const { t } = useTranslation();

  const { project, resources, canvases, conversations, fetchProjectResources } = useProjectStoreShallow((state) => ({
    project: state.project,
    resources: state.resources,
    canvases: state.canvases,
    conversations: state.conversations,
    fetchProjectResources: state.fetchProjectResources,
  }));
  const currentProject = project.data;

  const newCanvasModalStore = useNewCanvasModalStoreShallow((state) => ({
    setNewCanvasModalVisible: state.setNewCanvasModalVisible,
    setSelectedProjectId: state.setSelectedProjectId,
  }));

  const { jumpToCanvas, jumpToResource, jumpToConv } = useJumpNewPath();
  const { tabsMap, activeTabMap, handleAddTab } = useProjectTabs();
  const tabs = tabsMap[projectId] || [];
  const activeTab = tabs.find((x) => x.key === activeTabMap[projectId]);

  useEffect(() => {
    if (activeTab?.type === 'canvas') {
      jumpToCanvas({
        canvasId: activeTab.key,
        projectId,
      });
    }
    if (activeTab?.type === 'resource') {
      jumpToResource({
        resId: activeTab.key,
        projectId,
      });
    }
  }, [activeTab]);

  const [searchParams] = useSearchParams();
  const resId = searchParams.get('resId');
  const canvasId = searchParams.get('canvasId');

  // Watch for canvasId change
  useEffect(() => {
    if (canvasId) {
      const canvas = canvases.data?.find((item) => item.canvasId === canvasId);
      if (canvas) {
        handleAddTab({
          projectId,
          key: canvasId,
          title: canvas.title,
          type: 'canvas',
        });
      }
    }
  }, [canvasId, canvases]);

  // Watch for resId change
  useEffect(() => {
    if (resId) {
      const resource = resources.data?.find((item) => item.resourceId === resId);
      if (resource) {
        handleAddTab({
          projectId,
          key: resId,
          title: resource.title,
          type: 'resource',
        });
      }
    }
  }, [resId, resources]);

  const segmentOptions = [
    {
      label: t('common.canvas'),
      value: 'canvas',
    },
    {
      label: t('common.resource'),
      value: 'resource',
    },
    {
      label: t('common.thread'),
      value: 'thread',
    },
  ];

  const [selectedTab, setSelectedTab] = useState<DirectoryItemType>(resId ? 'resource' : 'canvas');

  const navigate = useNavigate();

  const handleDeleteKnowledgeBase = () => {
    let url = '/knowledge-base';
    if (resId) {
      url = `/knowledge-base?resId=${resId}`;
    }
    navigate(url, { replace: true });
  };

  let dataListLoading = false;
  let dataList: DirectoryListItem[] = [];
  if (selectedTab === 'canvas') {
    dataListLoading = canvases.loading;
    dataList = (canvases.data || []).map((item) => ({
      id: item.canvasId,
      title: item.title,
      type: 'canvas',
    }));
  } else if (selectedTab === 'resource') {
    dataListLoading = resources.loading;
    dataList = (resources.data || []).map((item) => ({
      id: item.resourceId,
      title: item.title,
      type: 'resource',
      url: item.data?.url,
    }));
  } else if (selectedTab === 'thread') {
    dataListLoading = conversations.loading;
    dataList = (conversations.data || []).map((item) => ({
      id: item.convId,
      title: item.title,
      type: 'thread',
    }));
  }

  const handleListItemClick = (item: DirectoryListItem) => {
    if (item.type === 'canvas') {
      jumpToCanvas({
        canvasId: item.id,
        projectId: projectId,
      });
      handleAddTab({
        projectId: projectId,
        key: item.id,
        title: item.title,
        type: 'canvas',
      });
    } else if (item.type === 'resource') {
      jumpToResource({
        resId: item.id,
        projectId: projectId,
      });
      handleAddTab({
        projectId: projectId,
        key: item.id,
        title: item.title,
        type: 'resource',
      });
    } else if (item.type === 'thread') {
      jumpToConv({
        convId: item.id,
        projectId: projectId,
      });
    }
  };

  const [searchVal, setSearchVal] = useState('');

  const handleSearchValChange = (val: string) => {
    setSearchVal(val);
  };

  const [bindResourceModalVisible, setBindResourceModalVisible] = useState(false);

  const handleAddNewButtonClick = () => {
    if (selectedTab === 'canvas') {
      newCanvasModalStore.setSelectedProjectId(projectId);
      newCanvasModalStore.setNewCanvasModalVisible(true);
    } else if (selectedTab === 'resource') {
      setBindResourceModalVisible(true);
    }
  };

  return (
    <div className="project-directory-container" style={small ? { width: 72, minWidth: 72 } : {}}>
      <div className="project-directory-intro">
        {small ? (
          <div className="project-directory-intro-small">
            <IconProject style={{ fontSize: 28, color: 'rgba(0, 0, 0, .5)', strokeWidth: 3 }} />
          </div>
        ) : (
          <>
            <div className="flex w-full">
              <div className="intro-icon">
                <IconProject style={{ fontSize: 28, color: 'rgba(0, 0, 0, .5)', strokeWidth: 3 }} />
              </div>
              <div className="ml-2 grow">
                {project?.loading ? (
                  <>
                    <Skeleton active className="w-full" paragraph={{ rows: 2 }} />
                  </>
                ) : (
                  <>
                    <div className="text-sm">{currentProject?.title}</div>
                    <div className="text-xs my-1 text-gray-500 max-h-10 overflow-auto">
                      {currentProject?.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span>
                        {time(currentProject?.updatedAt as string, LOCALE.EN)
                          .utc()
                          .fromNow()}
                      </span>
                      {' · '}
                      <span>
                        {t('knowledgeBase.directory.resourceCount', {
                          count: resources?.data?.length || 0,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {currentProject && (
              <DeleteDropdownMenu type="project" data={currentProject} postDeleteList={handleDeleteKnowledgeBase} />
            )}
          </>
        )}
      </div>

      <div className="w-full p-4">
        <Segmented
          block
          options={segmentOptions}
          value={selectedTab}
          onChange={(value) => {
            setSelectedTab(value as DirectoryItemType);
          }}
        />
      </div>

      <div className="px-4 pb-2 box-border">
        <div className="flex items-center">
          <Input
            placeholder={t('knowledgeBase.directory.searchPlaceholder')}
            allowClear
            className="h-8 w-full"
            value={searchVal}
            prefix={<HiOutlineSearch />}
            onChange={handleSearchValChange}
          />

          <div
            className="ml-2 w-8 h-8 flex items-center justify-center border border-solid border-gray-200 rounded-md cursor-pointer hover:bg-slate-200"
            onClick={handleAddNewButtonClick}
          >
            <HiOutlinePlus />
          </div>
        </div>
      </div>

      <div className="project-directory-list-container">
        {dataListLoading ? (
          <Skeleton active className="w-full p-6" title={false} paragraph={{ rows: 5 }} />
        ) : (
          dataList.map((item) => (
            <div
              key={item.id}
              className="flex items-center text-sm m-2 p-1 cursor-pointer hover:bg-gray-100"
              onClick={() => handleListItemClick(item)}
            >
              <div className="flex items-center align-center mx-2">
                {item.type === 'canvas' ? (
                  <IconCanvas />
                ) : item.type === 'resource' ? (
                  <Favicon url={item.url} />
                ) : item.type === 'thread' ? (
                  <IconThread />
                ) : null}
              </div>
              <div>{item.title}</div>
            </div>
          ))
        )}
      </div>

      <BindResourceModal
        domain="resource"
        mode="multiple"
        projectId={projectId}
        visible={bindResourceModalVisible}
        setVisible={setBindResourceModalVisible}
        postConfirmCallback={() => {
          fetchProjectResources(projectId);
        }}
      />
    </div>
  );
};
