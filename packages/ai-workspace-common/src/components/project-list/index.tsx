import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { List, Message as message, Empty } from '@arco-design/web-react';
import { FaRegCopy } from 'react-icons/fa6';
import { IconFolder } from '@arco-design/web-react/icon';
// types
import { IconTip } from '@refly-packages/ai-workspace-common/components/dashboard/icon-tip';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { getClientOrigin } from '@refly/utils/url';
// components
import { useEffect } from 'react';
import { ProjectItemCard } from '@refly-packages/ai-workspace-common/components/project-list/project-card';
import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/project-detail/delete-dropdown-menu';
// utils
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// styles
import './index.scss';
import { LOCALE } from '@refly/common-types';
import { Project, Source } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';

import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import { useJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';
import { useProjectStoreShallow } from '@refly-packages/ai-workspace-common/stores/project';
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';

export const getFirstSourceLink = (sources: Source[]) => {
  return sources?.[0]?.metadata?.source;
};
interface ProjectListProps {
  listGrid?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}
export const ProjectList = (props: ProjectListProps) => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const { listGrid } = props;

  const reloadListState = useReloadListState();

  const { dataList, setDataList, loadMore, reload, hasMore, isRequesting } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listProjects({
        query: queryPayload,
      });
      return res?.data;
    },
    pageSize: 12,
  });

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    if (reloadListState.reloadProjectList) {
      reload();
      reloadListState.setReloadProjectList(false);
    }
  }, [reloadListState.reloadProjectList]);

  const { projectActiveConvId } = useProjectStoreShallow((state) => ({
    projectActiveConvId: state.projectActiveConvId,
  }));
  const { jumpToProject, jumpToConv } = useJumpNewPath();

  const handleClickProject = (projectId: string) => {
    const activeConvId = projectActiveConvId[projectId] as string;
    jumpToConv({
      convId: activeConvId || '',
      projectId,
      state: {
        navigationContext: {
          shouldFetchDetail: true,
          source: MessageIntentSource.Project,
        },
      },
    });
  };

  if (dataList.length === 0 && !isRequesting) {
    return <Empty />;
  }

  return (
    <List
      grid={
        listGrid || {
          sm: 24,
          md: 12,
          lg: 8,
          xl: 6,
        }
      }
      className="knowledge-base-list workspace-list"
      wrapperStyle={{ width: '100%' }}
      bordered={false}
      pagination={false}
      dataSource={dataList}
      scrollLoading={<ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />}
      render={(item: Project, key) => (
        <List.Item
          key={item?.projectId + key}
          style={{
            padding: '0',
            width: '100%',
          }}
          className="knowledge-base-list-item-container"
          actionLayout="vertical"
          actions={[
            <ProjectItemCard
              index={key}
              cardData={item}
              cardIcon={<IconFolder style={{ fontSize: '32px', strokeWidth: 3 }} />}
              onClick={() => {
                if (!item?.projectId) return;
                handleClickProject(item.projectId);
              }}
            >
              <div className="flex justify-between items-center mt-6">
                <div className="text-xs text-black/40">
                  {time(item.updatedAt, language as LOCALE)
                    .utc()
                    .fromNow()}
                  {item?.shareCode && (
                    <span className="ml-1 text-xs text-[#00968F]">{t('projectDetail.share.sharing')}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <IconTip text={t('knowledgeLibrary.archive.item.copy')}>
                    <span
                      key={1}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(`${getClientOrigin()}/knowledge-base?kbId=${item?.projectId}`);
                        message.success(t('knowledgeLibrary.archive.item.copyNotify'));
                      }}
                    >
                      <FaRegCopy style={{ color: '#819292', cursor: 'pointer' }} />
                    </span>
                  </IconTip>
                  <DeleteDropdownMenu
                    type="project"
                    data={item}
                    postDeleteList={(project: Project) =>
                      setDataList(dataList.filter((n) => n.projectId !== project.projectId))
                    }
                    getPopupContainer={() => document.getElementById(`project-${key}`) as HTMLElement}
                  />
                </div>
              </div>
            </ProjectItemCard>,
          ]}
        ></List.Item>
      )}
    />
  );
};
