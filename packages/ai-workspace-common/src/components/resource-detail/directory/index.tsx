import { useEffect, useState } from 'react';
import { LOCALE } from '@refly/common-types';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

import './index.scss';
import { Segmented, Button, Divider, Skeleton, List, message, Popconfirm, Tooltip } from 'antd';
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
import { formatStorage } from '@refly-packages/ai-workspace-common/modules/entity-selector/utils';

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
    fetchData: async (queryPayload) => {
      const res = await getClient().listProjects({
        query: { ...queryPayload, resourceId },
      });
      return res?.data;
    },
    pageSize: 12,
  });

  const { resource, copilotSize, setCopilotSize } = useResourceStoreShallow((state) => ({
    copilotSize: state.copilotSize,
    resource: state.resource,
    setCopilotSize: state.setCopilotSize,
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
        label: 'addTime',
        value: time(metaInfo?.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        label: 'updateTime',
        value: time(metaInfo?.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        label: 'source',
        value: t(`resourceDetail.directory.${metaInfo?.resourceType}`),
      },
    ];

    const techInfoList = [
      {
        label: 'storageSize',
        value: formatStorage(resourceData?.storageSize || 0),
      },
      {
        label: 'vectorSize',
        value: formatStorage(resourceData?.vectorSize || 0),
      },
      {
        label: 'indexStatus',
        value: resourceData?.indexStatus ? t(`resource.${resourceData?.indexStatus}`) : '',
      },
    ];
    return (
      <div className="px-6 pt-2">
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-500 mb-1">{t('resourceDetail.directory.baseInfo')}</div>
          {baseInfoList.map((item) => (
            <div className="flex gap-2 mb-1" key={item.label}>
              <div className="text-xs font-normal w-20 text-gray-500">
                {t(`resourceDetail.directory.${item.label}`)}
              </div>
              <div className="text-xs font-normal w-30 text-gray-500">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium text-gray-500 mb-1">{t('resourceDetail.directory.techInfo')}</div>
          {techInfoList.map((item) => (
            <div className="flex gap-2 mb-1" key={item.label}>
              <div className="text-xs font-normal w-20 text-gray-500">
                {t(`resourceDetail.directory.${item.label}`)}
              </div>
              <div className="text-xs font-normal w-30 text-gray-500">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleDeleteClick = async ({ projectId, resourceId }) => {
    const { error, data } = await getClient().bindProjectResources({
      body: [
        {
          projectId,
          resourceId,
          operation: 'unbind',
        },
      ],
    });

    if (error || !data?.success) {
      return;
    }

    message.success({ content: t('common.putSuccess') });
    reloadProjects();
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
          <Button onClick={() => loadMore()}>{t('common.loadMore')}</Button>
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
              jumpToResource({ projectId: item.projectId, resId: resourceId });
              handleAddTab({
                projectId: item.projectId,
                key: resourceId,
                title: resourceData?.title,
                type: 'resource',
              });
            }}
          >
            <div className="w-full flex justify-between gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100">
              <div>
                <IconProject className="mr-2" />
                {item.title}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                  title={t('workspace.resourceProjectList.removeConfirmText')}
                  onConfirm={() => handleDeleteClick({ projectId: item.projectId, resourceId })}
                  onCancel={() => {}}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                >
                  <div
                    className="text-[#00968F] cursor-pointer hover:font-medium whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('common.remove')}
                  </div>
                </Popconfirm>
              </div>
            </div>
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
              {/* {' · '}
              <span>{t('resourceDetail.directory.referenced', { count: 9 })}</span> */}
            </div>
          </div>
        </div>
        <DeleteDropdownMenu type="resource" data={resourceData} postDeleteList={handleDeleteResource} />
      </div>

      <div className="p-4 w-full flex gap-3">
        <Button className="w-[50%]" icon={<HiOutlinePlus />} onClick={handleToProject}>
          {t('common.add')}
        </Button>
        <Button
          className="w-[50%]"
          icon={<HiOutlineSparkles />}
          onClick={() => setCopilotSize(copilotSize === 0 ? 400 : 0)}
          style={{ color: copilotSize === 0 ? '' : '#00968F' }}
        >
          Copilot
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
          reloadProjects();
          setSelectedTab('project');
        }}
      />
    </div>
  );
};
