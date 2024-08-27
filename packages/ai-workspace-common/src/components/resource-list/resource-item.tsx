import { LOCALE } from '@refly/common-types';
import { time } from '@refly-packages/ai-workspace-common/utils/time';

// styles
import './index.scss';
import { IconBook, IconBulb, IconCompass } from '@arco-design/web-react/icon';
import { Tag } from '@arco-design/web-react';

import { Resource, RemoveResourceFromCollectionRequest } from '@refly/openapi-schema';
// 类型
import { IndexStatus } from '@refly/openapi-schema';
// 请求
import { safeParseURL } from '@refly/utils/url';
import { Markdown } from '../markdown';
import classNames from 'classnames';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';

import { DeleteDropdownMenu } from '@refly-packages/ai-workspace-common/components/knowledge-base/delete-dropdown-menu';
import { memo } from 'react';

export const ResourceItem = memo(
  (props: {
    item: Resource;
    collectionId?: string;
    index: number;
    showUtil?: boolean;
    showDesc?: boolean;
    showBtn?: { summary: boolean; markdown: boolean; externalOrigin: boolean };
    canDelete?: boolean;
    btnProps?: { defaultActiveKeys: string[] };
    handleItemClick: ({ resourceId, collectionId }: { resourceId: string; collectionId: string }) => void;
    handleItemDelete?: (resource: RemoveResourceFromCollectionRequest) => void;
  }) => {
    const {
      item,
      index,
      btnProps = { defaultActiveKeys: ['markdown'] },
      showUtil = true,
      showDesc = true,
      showBtn = { summary: true, markdown: true, externalOrigin: true },
      canDelete,
      collectionId,
    } = props;
    const { jumpToReadResource } = useKnowledgeBaseJumpNewPath();

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
        id={`directory-resource-item-${item?.resourceId}`}
        className="knowledge-base-directory-item"
        key={index}
        onClick={() => {
          props?.handleItemClick({
            collectionId: collectionId as string,
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
          {canDelete && (
            <DeleteDropdownMenu
              data={{ resourceIds: [item?.resourceId], collectionId: collectionId }}
              type="resourceCollection"
              postDeleteList={(item: RemoveResourceFromCollectionRequest) => props.handleItemDelete(item)}
              getPopupContainer={() => document.getElementById(`directory-resource-item-${item?.resourceId}`)}
            />
          )}
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
          {showBtn?.markdown && item?.resourceId ? (
            <div
              className={classNames('action-markdown-content', {
                active: btnProps?.defaultActiveKeys?.includes('markdown'),
              })}
            >
              <IconBook
                onClick={() => {
                  jumpToReadResource({
                    resId: item?.resourceId,
                  });
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
        {showDesc ? (
          <div style={{ maxHeight: 200, overflowY: 'scroll' }}>
            <Markdown content={item?.content || ''} />
          </div>
        ) : null}
      </div>
    );
  },
);
