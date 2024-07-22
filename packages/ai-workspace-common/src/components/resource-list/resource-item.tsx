import { LOCALE } from '@refly/common-types';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

// styles
import './index.scss';
import { IconBook, IconBulb, IconCompass } from '@arco-design/web-react/icon';
import { Tag, Typography } from '@arco-design/web-react';

import { Resource } from '@refly/openapi-schema';
// 类型
import { IndexStatus } from '@refly/openapi-schema';
// 请求
import { safeParseURL } from '@refly/utils/url';
import { Markdown } from '../markdown';
import classNames from 'classnames';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';

export const ResourceItem = (props: {
  item: Partial<Resource>;
  index: number;
  showUtil?: boolean;
  showDesc?: boolean;
  showBtn?: { summary: boolean; markdown: boolean; externalOrigin: boolean };
  btnProps?: { defaultActiveKeys: string[] };
  handleItemClick: ({ resourceId, collectionId }: { resourceId: string; collectionId: string }) => void;
}) => {
  const {
    item,
    index,
    btnProps = { defaultActiveKeys: ['markdown'] },
    showUtil = true,
    showDesc = true,
    showBtn = { summary: true, markdown: true, externalOrigin: true },
  } = props;
  const navigate = useNavigate();

  const getIndexStatusText = (indexStatus?: IndexStatus) => {
    switch (indexStatus) {
      case 'processing':
        return '处理中';
      case 'failed':
        return '处理失败';
      default: {
        return '';
      }
    }
  };

  const getIndexStatusColor = (indexStatus?: IndexStatus) => {
    switch (indexStatus) {
      case 'processing':
        return 'orange';
      case 'failed':
        return 'red';
      default: {
        return '';
      }
    }
  };

  return (
    <div
      className="knowledge-base-directory-item"
      key={index}
      onClick={() => {
        props?.handleItemClick({
          collectionId: item?.collectionId as string,
          resourceId: item?.resourceId as string,
        });
      }}
    >
      <div className="knowledge-base-directory-site-intro">
        <div className="site-intro-icon">
          <img
            src={`https://www.google.com/s2/favicons?domain=${safeParseURL(item?.data?.url as string)}&sz=${32}`}
            alt={item?.data?.url}
          />
        </div>
        <div className="site-intro-content">
          <p className="site-intro-site-name">{item.data?.title}</p>
          <a className="site-intro-site-url" href={item.data?.url} target="_blank">
            {item.data?.url}
          </a>
        </div>
      </div>
      <div className="knowledge-base-directory-title">{item.data?.title}</div>
      <div className="knowledge-base-directory-action">
        {showBtn?.summary ? (
          <div
            className={classNames('action-summary', {
              active: btnProps?.defaultActiveKeys?.includes('summary'),
            })}
          >
            <IconBulb />
            <span>AI Summary</span>
          </div>
        ) : null}
        {showBtn?.markdown ? (
          <div
            className={classNames('action-markdown-content', {
              active: btnProps?.defaultActiveKeys?.includes('markdown'),
            })}
          >
            <IconBook
              onClick={() => {
                navigate(`/knowledge-base?kbId=${item?.collectionId}&resId=${item?.resourceId}`);
              }}
            />
          </div>
        ) : null}
        {showBtn?.externalOrigin ? (
          <div
            className={classNames('action-external-origin-website', {
              active: btnProps?.defaultActiveKeys?.includes('summary'),
            })}
          >
            <IconCompass
              onClick={() => {
                window.open(item?.data?.url, '_blank');
              }}
            />
          </div>
        ) : null}
      </div>
      {showUtil ? (
        <div className="resource-utility-info">
          <span>
            {time(item?.updatedAt as string, LOCALE.EN)
              .utc()
              .fromNow()}
          </span>
          {getIndexStatusText(item?.indexStatus) ? (
            <Tag color={getIndexStatusColor(item?.indexStatus)} style={{ marginLeft: 8 }} size="small">
              {getIndexStatusText(item?.indexStatus)}
            </Tag>
          ) : null}
        </div>
      ) : null}
      {/* <div className="knowledge-base-directory-keyword-list">
        {(item?.data?.keywords || [])?.map((keyword, index) => (
          <div className="knowledge-base-directory-keyword-item" key={index}>
            <span>{keyword}</span>
          </div>
        ))}
      </div> */}
      {showDesc ? (
        <div style={{ maxHeight: 200, overflowY: 'scroll' }}>
          <Markdown content={item?.description || ''} />
        </div>
      ) : null}
    </div>
  );
};
