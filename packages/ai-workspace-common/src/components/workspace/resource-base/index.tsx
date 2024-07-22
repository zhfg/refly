import { useEffect, useState } from 'react';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { useTranslation } from 'react-i18next';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

import { Resource } from '@refly/openapi-schema';
import { IconMore, IconBook } from '@arco-design/web-react/icon';

import { EmptyDigestStatus } from '@refly-packages/ai-workspace-common/components/empty-digest-today-status';

import { LOCALE } from '@refly/common-types';
import './index.scss';

export const ResourceBase = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.languages?.[0];

  const [resourceList, setResourceList] = useState([]);
  const getResourceList = async () => {
    const res: any =
      (await getClient().listResources({
        query: {
          resourceType: 'weblink',
        },
      })) || {};
    const listData: Resource[] = res?.data?.data || [];
    setResourceList(listData);
  };

  const handleClickLink = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    getResourceList();
  }, []);

  return (
    <div className="resource-base flex flex-wrap">
      {resourceList.length === 0 ? (
        <EmptyDigestStatus />
      ) : (
        resourceList.map((item: Resource) => {
          return (
            <div
              className="resource-item w-72 p-4 m-3 rounded-lg border border-black/8 hover:bg-gray-500/10"
              key={item.resourceId}
              onClick={() => {
                navigate(`/knowledge-base?kbId=${item.collectionId}&resId=${item.resourceId}`);
              }}
            >
              <div className="resource-img bg-emerald-200 rounded-lg"></div>

              <div className="h-40 overflow-hidden">
                <div className="resource-url flex mt-3 mb-1">
                  <div className="resource-icon flex items-center justify-center shrink-0 rounded-lg border border-black/8">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${item?.data?.url}&sz=${32}`}
                      alt={item?.data?.title}
                    />
                  </div>
                  <a
                    className="resource-url-text ml-2 hover:text-blue-600"
                    href="#"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClickLink(item?.data?.url);
                    }}
                  >
                    {item?.data?.url}
                  </a>
                </div>
                <div className="text-sm text-black/80 font-medium mb-1.5">{item?.title}</div>
                <div className="text-xs text-black/50">{item?.contentPreview}</div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="text-xs text-black/40">
                  {time(item.updatedAt, language as LOCALE)
                    .utc()
                    .fromNow()}
                </div>
                <div>
                  {/* TODO: 添加事件 */}
                  <IconBook style={{ color: '#819292', cursor: 'pointer' }} />
                  <IconMore style={{ color: '#819292', marginLeft: '12px', cursor: 'pointer' }} />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
