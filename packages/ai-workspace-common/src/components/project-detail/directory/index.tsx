import { useEffect, useLayoutEffect, useState } from 'react';
import { LOCALE } from '@refly/common-types';
import cn from 'classnames';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

import { Segmented, Skeleton, Button, Divider, Input, Empty } from 'antd';

import { useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import {
  ProjectDirListItem,
  ProjectDirListItemType,
  useProjectStore,
  useProjectStoreShallow,
} from '@refly-packages/ai-workspace-common/stores/project';
import { useNewCanvasModalStoreShallow } from '@refly-packages/ai-workspace-common/stores/new-canvas-modal';

import { BindResourceModal } from '../resource-view/resource-collection-associative-modal';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/project-detail/delete-dropdown-menu';
import { useTranslation } from 'react-i18next';
import { HiOutlineSearch } from 'react-icons/hi';
import { HiOutlinePlus, HiOutlineShare, HiOutlineSparkles } from 'react-icons/hi2';
import { IconCanvas, IconProject, IconThread } from '@refly-packages/ai-workspace-common/components/common/icon';
import { Favicon } from '@refly-packages/ai-workspace-common/components/common/favicon';
import { useProjectTabs } from '@refly-packages/ai-workspace-common/hooks/use-project-tabs';
import { useHandleShare } from '@refly-packages/ai-workspace-common/hooks/use-handle-share';

import { editorEmitter } from '@refly-packages/utils/event-emitter/editor';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuGripVertical } from 'react-icons/lu';
import { useDebouncedCallback } from 'use-debounce';
import { useDebounce } from 'react-use';

export const ProjectDirectory = (props: {
  projectId: string;
  setBindResourceModalVisible: (visible: boolean) => void;
}) => {
  const { projectId, setBindResourceModalVisible } = props;

  const { t } = useTranslation();

  const projectStore = useProjectStoreShallow((state) => ({
    project: state.project,
    resources: state.resources,
    canvases: state.canvases,
    conversations: state.conversations,
    copilotSize: state.copilotSize,
    setCopilotSize: state.setCopilotSize,
    setProjectDirItems: state.setProjectDirItems,
    updateProjectDirItem: state.updateProjectDirItem,
    fetchProjectDetail: state.fetchProjectDetail,
    fetchProjectDirItems: state.fetchProjectDirItems,
  }));

  const currentProject = projectStore.project?.data;
  const canvases = projectStore.canvases;
  const resources = projectStore.resources;

  const newCanvasModalStore = useNewCanvasModalStoreShallow((state) => ({
    setNewCanvasModalVisible: state.setNewCanvasModalVisible,
    setSelectedProjectId: state.setSelectedProjectId,
  }));

  const { jumpToCanvas, jumpToResource, jumpToConv } = useJumpNewPath();
  const { tabsMap, activeTabMap, handleAddTab } = useProjectTabs();
  const tabs = tabsMap[projectId] || [];
  const activeTab = tabs.find((x) => x.key === activeTabMap[projectId]);

  const [searchParams] = useSearchParams();
  const resId = searchParams.get('resId');
  const canvasId = searchParams.get('canvasId');
  const convId = searchParams.get('convId');

  useEffect(() => {
    if (activeTab?.type === 'canvas' && !canvasId) {
      jumpToCanvas({
        canvasId: activeTab.key,
        projectId,
      });
    }
    if (activeTab?.type === 'resource' && !resId) {
      jumpToResource({
        resId: activeTab.key,
        projectId,
      });
    }
  }, [activeTab, canvasId, resId]);

  const { createShare } = useHandleShare();
  const [shareLoading, setShareLoading] = useState(false);
  const handleShare = async () => {
    setShareLoading(true);
    await createShare({
      entityType: 'project',
      entityId: projectId,
      shareCode: currentProject?.shareCode || undefined,
    });
    setShareLoading(false);
  };

  // Watch for canvasId change
  useDebounce(
    () => {
      if (canvasId) {
        const canvas = canvases?.data?.find((item) => item.id === canvasId);
        if (canvas) {
          handleAddTab({
            projectId,
            key: canvasId,
            title: canvas.title,
            type: 'canvas',
          });
        }
      }
    },
    100,
    [canvasId, canvases],
  );

  // Watch for resId change
  useDebounce(
    () => {
      if (resId) {
        const resource = resources?.data?.find((item) => item.id === resId);
        if (resource) {
          handleAddTab({
            projectId,
            key: resId,
            title: resource.title,
            type: 'resource',
          });
        }
      }
    },
    100,
    [resId, resources],
  );

  const segmentOptions: { label: string; value: ProjectDirListItemType }[] = [
    {
      label: t('common.canvas'),
      value: 'canvases',
    },
    {
      label: t('common.resource'),
      value: 'resources',
    },
    {
      label: t('common.thread'),
      value: 'conversations',
    },
  ];

  const [selectedTab, setSelectedTab] = useState<ProjectDirListItemType>(resId ? 'resources' : 'canvases');

  const navigate = useNavigate();

  const handleDeleteProject = () => {
    navigate('/library?tab=project', { replace: true });
  };

  const dataListLoading = projectStore[selectedTab].loading;
  const dataList = projectStore[selectedTab].data || [];
  const [filteredDataList, setFilteredDataList] = useState(dataList);

  const handleListItemClick = (item: ProjectDirListItem) => {
    if (item.type === 'canvases') {
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
    } else if (item.type === 'resources') {
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
    } else if (item.type === 'conversations') {
      jumpToConv({
        convId: item.id,
        projectId: projectId,
        state: {
          navigationContext: {
            shouldFetchDetail: true,
            source: MessageIntentSource.Project,
          },
        },
      });
    }
  };

  const [searchVal, setSearchVal] = useState('');

  const handleAddNewButtonClick = () => {
    if (selectedTab === 'canvases') {
      newCanvasModalStore.setSelectedProjectId(projectId);
      newCanvasModalStore.setNewCanvasModalVisible(true);
    } else if (selectedTab === 'resources') {
      setBindResourceModalVisible(true);
    }
  };

  const debouncedFetchProjectDetail = useDebouncedCallback(projectStore.fetchProjectDetail, 1000);
  const debouncedFetchProjectDirItems = useDebouncedCallback(projectStore.fetchProjectDirItems, 1000);

  const handleTitleUpdate = async (newTitle: string) => {
    const { project } = useProjectStore.getState();
    const currentProject = project.data;

    // if project title is empty, update it with canvas title
    if (!currentProject?.title || currentProject?.title === 'Untitled') {
      await getClient().updateProject({
        body: {
          projectId: currentProject.projectId,
          title: newTitle,
        },
      });
      debouncedFetchProjectDetail(currentProject.projectId); // re-fetch project detail
    }

    // re-fetch project resources
    debouncedFetchProjectDirItems(projectId, 'resources');
  };

  useEffect(() => {
    editorEmitter.on('updateCanvasTitle', handleTitleUpdate);

    return () => {
      editorEmitter.off('updateCanvasTitle', handleTitleUpdate);
    };
  }, [currentProject]);

  const SortableItem = ({ item, onItemClick }: { item: ProjectDirListItem; onItemClick: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center p-1 m-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 group',
          (activeTab?.key === item.id || convId === item.id) && 'bg-gray-100',
        )}
      >
        <div className="flex items-center grow" onClick={onItemClick}>
          <div className="flex items-center mx-2">
            {item.type === 'canvases' ? (
              <IconCanvas />
            ) : item.type === 'resources' ? (
              <Favicon url={item.url} />
            ) : item.type === 'conversations' ? (
              <IconThread />
            ) : null}
          </div>
          <div>{item.title}</div>
        </div>
        {item.type !== 'conversations' && (
          <div
            className="flex invisible items-center text-gray-400 group-hover:visible cursor-grab hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <LuGripVertical />
          </div>
        )}
      </div>
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const remoteUpdateDirListItemOrder = useDebouncedCallback(async (newList: ProjectDirListItem[]) => {
    const needUpdateItems = newList
      .map((item, index) => ({
        ...item,
        order: index,
        needUpdate: item.order !== index,
      }))
      .filter((item) => item.needUpdate);

    if (selectedTab === 'canvases') {
      await getClient().batchUpdateCanvas({
        body: needUpdateItems.map((item) => ({
          canvasId: item.id,
          order: item.order,
        })),
      });
    } else if (selectedTab === 'resources') {
      await getClient().bindProjectResources({
        body: needUpdateItems.map((item) => ({
          projectId,
          operation: 'bind',
          resourceId: item.id,
          order: item.order,
        })),
      });
    }

    // Reset the order in the store
    projectStore.setProjectDirItems(
      projectId,
      selectedTab,
      newList.map((item, index) => ({ ...item, order: index })),
    );
  }, 1000);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = dataList.findIndex((item) => item.id === active.id);
      const newIndex = dataList.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(dataList, oldIndex, newIndex);

      projectStore.setProjectDirItems(projectId, selectedTab, newOrder);
      remoteUpdateDirListItemOrder(newOrder);
    }
  };

  const onSearchValChange = (value: string) => {
    setSearchVal(value);
  };

  useEffect(() => {
    setFilteredDataList(dataList.filter((item) => item.title.includes(searchVal)));
  }, [searchVal, dataList]);

  useEffect(() => {
    if (canvasId) {
      setSelectedTab('canvases');
      return;
    }
    if (resId) {
      setSelectedTab('resources');
      return;
    }
  }, [resId, canvasId]);

  return (
    <div className="flex flex-col h-full project-detail-directory-container">
      <div className="flex flex-row justify-between items-center p-4 pb-0">
        <div className="flex w-full">
          <div className="intro-icon">
            <IconProject style={{ fontSize: 28, color: 'rgba(0, 0, 0, .5)', strokeWidth: 3 }} />
          </div>
          <div className="ml-2 grow">
            {projectStore.project?.loading ? (
              <>
                <Skeleton active className="w-full" paragraph={{ rows: 2 }} />
              </>
            ) : (
              <>
                <div className="text-sm">{currentProject?.title}</div>
                <div className="overflow-auto my-1 max-h-10 text-xs text-gray-500">{currentProject?.description}</div>
                <div className="mt-1 text-xs text-gray-500">
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
          <DeleteDropdownMenu type="project" data={currentProject} postDeleteList={handleDeleteProject} />
        )}
      </div>

      <div className="flex gap-3 p-4 w-full">
        <Button
          loading={shareLoading}
          className="w-[50%]"
          style={{ color: currentProject?.shareCode ? '#00968F' : '' }}
          icon={<HiOutlineShare />}
          onClick={handleShare}
        >
          {currentProject?.shareCode ? t('projectDetail.share.sharing') : t('common.share')}
        </Button>
        <Button
          className="w-[50%]"
          icon={<HiOutlineSparkles />}
          style={{ color: projectStore.copilotSize === 0 ? '' : '#00968F' }}
          onClick={() => {
            projectStore.setCopilotSize(projectStore.copilotSize === 0 ? 500 : 0);
          }}
        >
          Copilot
        </Button>
      </div>

      <div className="pr-4 pl-4 w-full">
        <Divider className="m-0" />
      </div>

      <div className="p-4 w-full">
        <Segmented
          block
          options={segmentOptions}
          value={selectedTab}
          onChange={(value) => {
            setSelectedTab(value as ProjectDirListItemType);
          }}
        />
      </div>

      <div className="box-border px-4 pb-2">
        <div className="flex items-center">
          <Input
            placeholder={t(`knowledgeBase.directory.${selectedTab}SearchPlaceholder`)}
            allowClear
            className="w-full h-8"
            value={searchVal}
            prefix={<HiOutlineSearch className="mr-1" />}
            onChange={(e) => onSearchValChange(e.target.value)}
          />

          {selectedTab !== 'conversations' && (
            <div
              className="flex flex-shrink-0 justify-center items-center ml-2 w-8 h-8 rounded-md border border-gray-200 border-solid cursor-pointer hover:bg-slate-200"
              onClick={handleAddNewButtonClick}
            >
              <HiOutlinePlus />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-auto flex-1 min-h-10">
        {dataListLoading ? (
          <Skeleton active className="p-6 w-full" title={false} paragraph={{ rows: 5 }} />
        ) : filteredDataList.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredDataList.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {filteredDataList.map((item) => (
                <SortableItem key={item.id} item={item} onItemClick={() => handleListItemClick(item)} />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <Empty className="mt-8" description={t(`projectDetail.directory.empty`)} />
        )}
      </div>
    </div>
  );
};
