import { useEffect, useState } from 'react';
import { LOCALE } from '@refly/common-types';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

import './index.scss';
import { Segmented, Button, Divider, Skeleton, List, message, Popconfirm } from 'antd';
import type { PopconfirmProps } from 'antd';

import { useNavigate, useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/resource';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { BindResourceModal } from '@refly-packages/ai-workspace-common/components/project-detail/resource-view/resource-collection-associative-modal';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/project-detail/delete-dropdown-menu';
import { useTranslation } from 'react-i18next';
import { HiOutlineSearch } from 'react-icons/hi';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineSparkles } from 'react-icons/hi2';
import { IconCanvas, IconProject, IconThread } from '@refly-packages/ai-workspace-common/components/common/icon';
import { Favicon } from '@refly-packages/ai-workspace-common/components/common/favicon';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useProjectTabs } from '@refly-packages/ai-workspace-common/hooks/use-project-tabs';

type DirectoryItemType = 'meta' | 'project';

export const ResourceDirectory = (props: { resourceId: string }) => {
  const { resourceId } = props;

  const { t } = useTranslation();

  const {
    dataList,
    loadMore,
    hasMore,
    isRequesting,
    reload: reloadProjects,
  } = useFetchDataList({
    fetchData: async (resourceId) => {
      const res = await getClient().listProjects({
        query: { resourceId },
      });
      return res?.data;
    },
    pageSize: 12,
  });

  const { resource } = useResourceStoreShallow((state) => ({
    resource: state.resource,
  }));
  const resourceData = resource.data;

  const { jumpToResource } = useJumpNewPath();
  const { handleAddTab } = useProjectTabs();

  const segmentOptions = [
    {
      label: t('common.meta'),
      value: 'meta',
    },
    {
      label: t('common.project'),
      value: 'project',
    },
  ];

  const [selectedTab, setSelectedTab] = useState<DirectoryItemType>('meta');

  const navigate = useNavigate();

  const handleDeleteResource = () => {
    console.log('handleDeleteResource');
    navigate('/library?tab=resource', { replace: true });
  };

  const [bindResourceModalVisible, setBindResourceModalVisible] = useState(false);

  const handleToProject = () => {
    setBindResourceModalVisible(true);
  };

  const MetaInfo = () => {
    const metaInfo = resourceData;
    const baseInfoList = [
      {
        label: '文件大小',
        value: metaInfo?.fileSize,
      },
      {
        label: '添加时间',
        value: time(metaInfo?.createdAt as string, LOCALE.EN)
          .utc()
          .fromNow(),
      },
      {
        label: '更新时间',
        value: time(metaInfo?.updatedAt as string, LOCALE.EN)
          .utc()
          .fromNow(),
      },
      {
        label: '来源',
        value: metaInfo?.resourceType,
      },
    ];

    const techInfoList = [
      {
        label: 'Token 占用',
        value: metaInfo?.token,
      },
      {
        label: '索引状态',
        value: t(`resource.${metaInfo?.indexStatus}`),
      },
    ];
    return (
      <div className="pl-4 pr-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-500 mb-1">基础信息</div>
          {baseInfoList.map((item) => (
            <div className="flex gap-2 mb-1">
              <div className="text-xs font-medium text-gray-500">{item.label}</div>
              <div className="text-xs font-medium text-gray-500">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium text-gray-500 mb-1">技术参数</div>
          {techInfoList.map((item) => (
            <div className="flex gap-2 mb-1">
              <div className="text-xs font-medium text-gray-500">{item.label}</div>
              <div className="text-xs font-medium text-gray-500">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleDeleteClick = async ({ collectionId, resourceId }) => {
    let resultError: unknown;
    try {
      const { error } = await getClient().bindProjectResources({
        body: { projectId: collectionId, resourceIds: [resourceId], operation: 'unbind' },
      });
      resultError = error;
    } catch (error) {
      resultError = error;
    }

    if (resultError) {
      message.error({ content: t('common.putErr') });
    } else {
      message.success({ content: t('common.putSuccess') });
      reloadProjects();
    }
  };

  const ProjectList = () => {
    const loadProjectsMore =
      !isRequesting && hasMore ? (
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            height: 32,
            lineHeight: '32px',
          }}
        >
          <Button onClick={loadMore}>loading more</Button>
        </div>
      ) : null;

    return (
      <List
        className="project-list pl-4 pr-4"
        loading={isRequesting}
        split={false}
        itemLayout="horizontal"
        loadMore={loadProjectsMore}
        dataSource={dataList}
        renderItem={(item) => (
          <List.Item
            className="project-list-item"
            onClick={() => {
              console.log('item', item);
              jumpToResource({ projectId: item.projectId, resId: resourceId });
              handleAddTab({
                projectId: item.projectId,
                key: resourceId,
                title: resourceData?.title,
                type: 'resource',
              });
            }}
          >
            <Skeleton title={false} loading={item.loading} active>
              <div className="w-full flex justify-between gap-2 p-2 rounded-md hover:bg-gray-100">
                <div>{item.title}</div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Popconfirm
                    title={t('workspace.resourceProjectList.removeConfirmText')}
                    onConfirm={() => handleDeleteClick({ collectionId: item.projectId, resourceId })}
                    onCancel={() => {}}
                    okText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                  >
                    <div
                      className="text-[#00968F] cursor-pointer hover:font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      remove
                    </div>
                  </Popconfirm>
                </div>
              </div>
            </Skeleton>
          </List.Item>
        )}
      />
    );
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <div className="resource-directory flex flex-col h-full">
      <div className="project-directory-intro">
        <div className="intro-body">
          <div className="intro-icon">
            <img
              src={`https://www.google.com/s2/favicons?domain=${resourceData?.data?.url}&sz=${32}`}
              alt={resourceData?.data?.title}
            />
          </div>

          <div className="intro-content">
            <div className="text-sm">{resourceData?.title}</div>
            <div className="intro-meta">
              <span>
                {time(resourceData?.updatedAt as string, LOCALE.EN)
                  .utc()
                  .fromNow()}
              </span>
              {' · '}
              <span>x被引用</span>
            </div>
          </div>
        </div>
        <DeleteDropdownMenu type="resource" data={resourceData} postDeleteList={handleDeleteResource} />
      </div>

      <div className="p-4 w-full flex gap-3">
        <Button className="w-[50%]" icon={<HiOutlinePlus />} onClick={handleToProject}>
          添加
        </Button>
        <Button className="w-[50%]" icon={<HiOutlineSparkles />}>
          AI
        </Button>
      </div>

      <div className="w-full pl-4 pr-4">
        <Divider className="m-0" />
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

      <div className="flex-grow overflow-auto hide-scrollbar">
        {selectedTab === 'meta' && <MetaInfo />}
        {selectedTab === 'project' && <ProjectList />}
      </div>

      <BindResourceModal
        domain="project"
        resourceId={resourceId}
        visible={bindResourceModalVisible}
        setVisible={setBindResourceModalVisible}
        postConfirmCallback={() => {
          console.log('kkk');
          reloadProjects();
          setSelectedTab('project');
        }}
      />
    </div>
  );
};
