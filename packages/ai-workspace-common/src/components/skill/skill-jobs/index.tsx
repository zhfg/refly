import { useState, useEffect } from 'react';

// components
import { useTranslation } from 'react-i18next';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';
// store
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';

import './index.scss';
import { SkillJob } from '@refly/openapi-schema';

import { ScrollLoading } from '@refly-packages/ai-workspace-common/components/workspace/scroll-loading';
import { List, Empty, Typography, Grid, Divider } from '@arco-design/web-react';
import { IconCheckCircle, IconLoading, IconCloseCircle, IconSchedule, IconDelete } from '@arco-design/web-react/icon';

const Row = Grid.Row;
const Col = Grid.Col;

interface SkillJobsProps {
  reloadList?: boolean;
  setReloadList?: (val: boolean) => void;
}
export const SkillJobs = (props: SkillJobsProps) => {
  const { reloadList, setReloadList } = props;
  const [searchParams] = useSearchParams();
  const skillId = searchParams.get('skillId') as string;

  const { dataList, setDataList, loadMore, hasMore, isRequesting, reload } = useFetchDataList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listSkillJobs({
        query: { ...queryPayload, skillId },
      });
      return res?.data;
    },
    pageSize: 12,
  });

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    if (reloadList) {
      reload();
      setReloadList(false);
    }
  }, [reloadList]);

  const JobStatus = (props: { status: string }) => {
    switch (props.status) {
      case 'finish':
        return <IconCheckCircle style={{ color: '#00B42A' }} />;
      case 'failed':
        return <IconCloseCircle style={{ color: '#D80101' }} />;
      case 'running':
        return <IconLoading style={{ color: '#C9A300' }} />;
      default:
        return null;
    }
  };

  const JobCard = (props: { job: SkillJob }) => {
    const { job } = props;
    const { collectionIds, noteIds, resourceIds, urls } = job.context;
    return (
      <div className="skill-jobs__card">
        <Row align="center" justify="center">
          <Col span={2} className="skill-jobs__card-col">
            <JobStatus status={job.jobStatus} />
          </Col>
          <Col span={1} className="skill-jobs__card-col">
            <Divider type="vertical" />
          </Col>
          <Col span={4}>
            <div className="skill-jobs__card-event">
              <IconSchedule />
              <Typography.Paragraph ellipsis={{ rows: 1 }} style={{ marginBottom: 0, marginLeft: 8 }}>
                每天 21:00
              </Typography.Paragraph>
            </div>
          </Col>
          <Col span={1}>
            <Divider type="vertical" />
          </Col>
          <Col span={16}>
            <div className="skill-jobs__card-right">
              <div>{job.skillDisplayName}</div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  if (dataList.length === 0) {
    return <Empty description="暂无运行记录" />;
  }
  return (
    <List
      className="skill-jobs"
      wrapperStyle={{ width: '100%' }}
      bordered={false}
      split={false}
      pagination={false}
      dataSource={dataList}
      scrollLoading={<ScrollLoading isRequesting={isRequesting} hasMore={hasMore} loadMore={loadMore} />}
      render={(item: SkillJob, key) => (
        <List.Item
          key={item?.jobId + key}
          style={{
            padding: '0',
            width: '100%',
          }}
          actionLayout="vertical"
          onClick={() => {}}
        >
          <JobCard job={item} />
        </List.Item>
      )}
    />
  );
};
