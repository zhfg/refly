import { ReactNode, useEffect, useState } from 'react';
import { Typography, Spin } from '@arco-design/web-react';
import { IconCloseCircle, IconLoading } from '@arco-design/web-react/icon';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';

import { Resource } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import './index.scss';

interface ResourceCard {
  index: number;
  cardIcon?: ReactNode;
  children?: ReactNode;
  onClick: () => void;
  cardData: Resource;
  isReindexing: boolean;
  reLoadResource?: () => void;
  handleReindexResource?: () => void;
}

export const ResourceCard = (props: ResourceCard) => {
  const { t } = useTranslation();
  const { children, cardData, isReindexing, onClick, reLoadResource, handleReindexResource } = props;
  const [loading, setLoading] = useState(false);

  const handleClickLink = (url: string) => {
    if (url) {
      window.open(url, '_blank');
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

  return (
    <div id={`resource-${props.index}`}>
      <Spin
        loading={loading}
        className={loading ? 'loading-box' : ''}
        tip={
          <div
            className={`${cardData?.indexStatus}-tip`}
            onClick={(e) => {
              e.stopPropagation();
              handleReindexResource && handleReindexResource();
            }}
          >
            {t(`resource.${cardData?.indexStatus}`)}
          </div>
        }
        style={{ width: '100%', height: '100%' }}
        element={
          cardData?.indexStatus === 'parse_failed' ? (
            isReindexing ? (
              <IconLoading style={{ color: 'rgb(220 38 38)', fontSize: 30, strokeWidth: 2 }} />
            ) : (
              <IconCloseCircle style={{ color: 'rgb(220 38 38)', fontSize: 30, strokeWidth: 2 }} />
            )
          ) : null
        }
      >
        <div className="p-4 m-3 border rounded-lg card-box border-black/8" onClick={() => onClick()}>
          <div className="content h-60 overflow-hidden relative">
            <div className="flex items-center mb-1 resource-url">
              <div className="flex items-center justify-center border rounded-lg card-icon-box shrink-0 border-black/8">
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

          {children}
        </div>
      </Spin>
    </div>
  );
};
