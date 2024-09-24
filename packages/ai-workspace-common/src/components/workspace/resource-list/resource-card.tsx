import { ReactNode, useEffect, useState } from 'react';
import { Typography, Spin, Divider, Tooltip } from '@arco-design/web-react';
import { IconCloseCircle, IconLoading } from '@arco-design/web-react/icon';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/delete-dropdown-menu';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

import { Resource } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly/common-types';
import './index.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

interface ResourceCard {
  index: number;
  cardIcon?: ReactNode;
  onClick: () => void;
  cardData: Resource;
  reLoadResource?: () => void;
  handleReindexResource?: () => Promise<void>;
  deleteData?: (resource: Resource) => void;
}

export const ResourceCard = (props: ResourceCard) => {
  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];
  const { cardData, index, onClick, reLoadResource, handleReindexResource, deleteData } = props;
  const [loading, setLoading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  const handleClickLink = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleReindex = async () => {
    if (isReindexing) return;
    if (handleReindexResource) {
      setIsReindexing(true);
      await handleReindexResource();
      setIsReindexing(false);
    }
  };

  useEffect(() => {
    if (['wait_parse', 'parse_failed'].includes(cardData?.indexStatus)) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [cardData?.indexStatus]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (['wait_parse', 'wait_index'].includes(cardData?.indexStatus)) {
      intervalId = setInterval(() => {
        reLoadResource();
      }, 2000); // 每2秒刷新一次
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [cardData?.indexStatus, reLoadResource]);

  const IndexStatus = (props: { status: string; icon?: React.ReactNode }) => {
    const { status, icon } = props;
    return (
      <>
        <Divider style={{ margin: '0 4px' }} type="vertical" />
        <Tooltip
          getPopupContainer={getPopupContainer}
          mini
          content={t(`resource.${status}_tip`)}
          style={status === 'index_failed' ? {} : { width: 200 }}
        >
          <div
            className={status}
            onClick={(e) => {
              e.stopPropagation();
              if (status === 'index_failed') {
                handleReindex();
              }
            }}
          >
            {icon}
            {t(`resource.${status}`)}
          </div>
        </Tooltip>
      </>
    );
  };

  return (
    <div id={`resource-${props.index}`}>
      <Spin
        loading={loading}
        className={loading ? 'loading-box' : ''}
        tip={
          <div
            className={`${isReindexing ? 'wait_parse-tip' : cardData?.indexStatus}-tip`}
            onClick={(e) => {
              e.stopPropagation();
              handleReindex();
            }}
          >
            {t(`resource.${isReindexing ? 'wait_parse' : cardData?.indexStatus}`)}
          </div>
        }
        style={{ width: '100%', height: '100%' }}
        element={
          cardData?.indexStatus === 'parse_failed' ? (
            isReindexing ? (
              <IconLoading />
            ) : (
              <IconCloseCircle style={{ color: 'rgb(220 38 38)', fontSize: 30, strokeWidth: 2 }} />
            )
          ) : null
        }
      >
        <div className="p-4 m-3 rounded-lg border card-box border-black/8" onClick={() => onClick()}>
          <div className="overflow-hidden relative h-60 content">
            <div className="flex items-center mb-1 resource-url">
              <div className="flex justify-center items-center rounded-lg border card-icon-box shrink-0 border-black/8">
                {props.cardIcon}
              </div>
              {cardData?.data?.url ? (
                <a
                  className="ml-2 text-xs"
                  href="#"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickLink(props.cardData.data?.url);
                  }}
                >
                  <Typography.Text ellipsis={{ rows: 1 }} style={{ marginBottom: 0 }}>
                    {props?.cardData?.data?.url}
                  </Typography.Text>
                </a>
              ) : (
                <Typography.Text ellipsis={{ rows: 2 }} style={{ marginBottom: 0, marginLeft: 8, fontWeight: 600 }}>
                  {props.cardData?.title}
                </Typography.Text>
              )}
            </div>
            {cardData?.data?.url && (
              <Typography.Text ellipsis={{ rows: 1 }} style={{ marginBottom: 2, fontWeight: 600 }}>
                {props.cardData?.title}
              </Typography.Text>
            )}
            <div style={{ marginBottom: 0, marginTop: 16, position: 'relative' }}>
              <Markdown content={props.cardData?.contentPreview} fontSize={12} />
            </div>
          </div>

          <div className="flex relative justify-between items-center pt-6">
            <div className="flex items-center text-xs text-black/40">
              <div className="text-xs text-black/40 mr-[4px]">
                {time(cardData.updatedAt, language as LOCALE)
                  .utc()
                  .fromNow()}
              </div>
              {cardData.indexStatus === 'wait_index' && (
                <IndexStatus status="wait_index" icon={<IconLoading style={{ marginRight: 4 }} />} />
              )}

              {cardData.indexStatus === 'index_failed' && (
                <IndexStatus
                  status="index_failed"
                  icon={isReindexing ? <IconLoading style={{ marginRight: 4 }} /> : null}
                />
              )}
            </div>
            <div>
              <DeleteDropdownMenu
                data={cardData}
                type="resource"
                postDeleteList={(resource: Resource) => deleteData(resource)}
                getPopupContainer={() => document.getElementById(`resource-${index}`) as HTMLElement}
              />
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
};
