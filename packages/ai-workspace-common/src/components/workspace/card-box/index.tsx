import { ReactNode, useEffect, useState } from 'react';
import { Typography, Spin } from '@arco-design/web-react';
import { FaRegCircleXmark } from 'react-icons/fa6';
import { IconCloseCircle } from '@arco-design/web-react/icon';

import { Resource, Note, Collection } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import './index.scss';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';

interface CardBoxBaseProps {
  index: number;
  type: string;
  cardIcon?: ReactNode;
  children?: ReactNode;
  onClick: () => void;
}

interface ResourceCardProps extends CardBoxBaseProps {
  type: 'resource';
  cardData: Resource;
  reLoadResource?: () => void;
}

interface NoteCardProps extends CardBoxBaseProps {
  type: 'note';
  cardData: Note;
}

interface CollectionCardProps extends CardBoxBaseProps {
  type: 'collection';
  cardData: Collection;
}

const contentKey = {
  resource: 'contentPreview',
  note: 'contentPreview',
  collection: 'description',
};

export const CardBox = (props: ResourceCardProps | NoteCardProps | CollectionCardProps) => {
  const { t } = useTranslation();
  const { children, onClick, type, cardData } = props;
  const [loading, setLoading] = useState(false);
  const reLoadResource = type === 'resource' ? props.reLoadResource : undefined;

  const handleClickLink = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (type === 'resource' && ['wait_parse', 'parse_failed'].includes(cardData?.indexStatus)) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [cardData?.indexStatus, type, reLoadResource]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (type === 'resource' && ['wait_parse', 'wait_index'].includes(cardData?.indexStatus)) {
      intervalId = setInterval(() => {
        reLoadResource();
      }, 2000); // 每2秒刷新一次
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [cardData?.indexStatus, reLoadResource, type]);

  return (
    <div id={`${props.type}-${props.index}`}>
      <Spin
        loading={loading}
        className={loading ? 'loading-box' : ''}
        tip={
          <div
            className="parse-failed-tip"
            onClick={(e) => {
              e.stopPropagation();
              reLoadResource(cardData.resourceId);
            }}
          >
            {t(`resource.${cardData?.indexStatus}`)}
          </div>
        }
        style={{ width: '100%', height: '100%' }}
        element={
          type === 'resource' && cardData?.indexStatus === 'parse_failed' ? (
            <IconCloseCircle style={{ color: 'rgb(220 38 38)', fontSize: 30, strokeWidth: 2 }} />
          ) : null
        }
      >
        <div className="p-4 m-3 border rounded-lg card-box border-black/8" onClick={() => onClick()}>
          <div className="h-40 overflow-hidden">
            <div className="flex items-center mb-1 resource-url">
              <div className="flex items-center justify-center border rounded-lg card-icon-box shrink-0 border-black/8">
                {props.cardIcon}
              </div>
              {props.type === 'resource' && props?.cardData?.data?.url ? (
                <a
                  className="ml-2 text-xs"
                  href="#"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickLink(props.cardData.data?.url);
                  }}
                >
                  {props?.cardData?.data?.url}
                </a>
              ) : (
                <Typography.Text ellipsis={{ rows: 2 }} style={{ marginBottom: 0, marginLeft: 8, fontWeight: 600 }}>
                  {props.cardData?.title}
                </Typography.Text>
              )}
            </div>
            {props.type === 'resource' && props?.cardData?.data?.url && (
              <Typography.Text ellipsis={{ rows: 1 }} style={{ marginBottom: 2, fontWeight: 600 }}>
                {props.cardData?.title}
              </Typography.Text>
            )}
            <div style={{ marginBottom: 0, marginTop: 16 }}>
              <Markdown content={props.cardData?.[contentKey[props.type]]} fontSize={12} />
            </div>
          </div>

          {children}
        </div>
      </Spin>
    </div>
  );
};
