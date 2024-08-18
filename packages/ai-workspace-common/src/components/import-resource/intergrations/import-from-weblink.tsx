import {
  Button,
  Divider,
  Input,
  List,
  Avatar,
  Skeleton,
  Select,
  Message as message,
  Affix,
} from '@arco-design/web-react';
import { IconLink, IconClose } from '@arco-design/web-react/icon';
import { useEffect, useState } from 'react';
import cherrio from 'cheerio';

// utils
import { isUrl } from '@refly/utils/isUrl';
import { genUniqueId } from '@refly-packages/utils/id';
import { LinkMeta, useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchResult, UpsertResourceRequest } from '@refly/openapi-schema';
import { useFetchOrSearchList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-or-search-list';
import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

const { TextArea } = Input;
const Option = Select.Option;

export const ImportFromWeblink = () => {
  const [linkStr, setLinkStr] = useState('');
  const [scrapeLinkLoading, setScrapeLinkLoading] = useState(false);
  const importResourceStore = useImportResourceStore();
  const reloadListState = useReloadListState();

  const [queryParams] = useSearchParams();
  const kbId = queryParams.get('kbId');

  console.log('select collection id', importResourceStore.selectedCollectionId);

  //
  const [saveLoading, setSaveLoading] = useState(false);

  // 列表获取
  const { loadMore, hasMore, dataList, isRequesting, currentPage, handleValueChange, mode } = useFetchOrSearchList({
    fetchData: async (queryPayload) => {
      const res = await getClient().listCollections({
        query: {
          ...queryPayload,
        },
      });

      const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
        id: item?.collectionId,
        title: item?.title,
        domain: 'collection',
      }));
      return { success: res?.data?.success, data };
    },
  });

  const scrapeSingleUrl = async (key: string, url: string) => {
    const { scrapeLinks } = useImportResourceStore.getState();
    try {
      const res = await fetch(url);
      const html = await res.text();
      const $ = cherrio.load(html);

      // 获取 OG title
      const title = $('meta[property="og:title"]').attr('content') || $('title').text();

      // 获取 OG description
      const description =
        $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');

      // 获取 OG image
      // 获取 OG image 或第一张合适的图片
      let image = $('meta[property="og:image"]').attr('content');
      if (!image) {
        // 如果没有 og:image，获取第一张以 http 或 https 开头的图片
        $('img').each((index, element) => {
          const src = $(element).attr('src');
          if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
            image = src;
            return false; // 跳出 each 循环
          }
        });
      }

      const newLinks = scrapeLinks.map((link) => {
        if (link?.key === key) {
          link.title = title;
          link.description = description;
          link.image = image;
          link.isHandled = true;
        }

        return link;
      });
      importResourceStore.setScapeLinks(newLinks);
    } catch (err) {
      console.log('fetch url error, silent ignore');
      const newLinks = scrapeLinks.map((link) => {
        if (link?.key === key) {
          link.isError = true;
        }

        return link;
      });
      importResourceStore.setScapeLinks(newLinks);
    }
  };

  const scrapeLink = async (linkStr: string) => {
    setScrapeLinkLoading(true);

    try {
      const links: LinkMeta[] = linkStr
        .split('\n')
        .filter((str) => str && isUrl(str))
        .map((url) => ({
          url,
          key: genUniqueId(),
          isHandled: false,
        }));

      if (links?.length === 0) {
        return;
      }

      importResourceStore.setScapeLinks(links);

      // 开始爬取信息
      await Promise.all(links.map((link) => scrapeSingleUrl(link.key, link.url)));
    } catch (err) {}

    setScrapeLinkLoading(false);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    const { scrapeLinks, selectedCollectionId } = useImportResourceStore.getState();

    if (scrapeLinks?.length === 0) {
      message.warning('你还未添加任何链接！');
      return;
    }

    const batchCreateResourceData: UpsertResourceRequest[] = scrapeLinks.map((link) => {
      return {
        resourceType: 'weblink',
        data: {
          url: link?.url,
          title: link?.title,
        },
        collectionId: selectedCollectionId === 'new-collection' ? undefined : selectedCollectionId,
      };
    });

    try {
      const res = await getClient().batchCreateResource({
        body: batchCreateResourceData,
      });

      if (!res?.data?.success) {
        setSaveLoading(false);
        message.error('保存失败');
        return;
      }

      message.success('保存成功');
      importResourceStore.setScapeLinks([]);
      importResourceStore.setImportResourceModalVisible(false);
      if (!kbId || (kbId && selectedCollectionId === kbId)) {
        reloadListState.setReloadKnowledgeBaseList(true);
        reloadListState.setReloadResourceList(true);
      }
      setLinkStr('');
    } catch (err) {
      message.error('保存失败');
    }

    setSaveLoading(false);
  };

  useEffect(() => {
    loadMore();
    importResourceStore.setSelectedCollectionId(kbId);
    return () => {
      /* reset selectedCollectionId after modal hide */
      importResourceStore.setSelectedCollectionId('');
    };
  }, []);

  return (
    <div className="intergation-container intergation-import-from-weblink">
      <div className="intergation-content">
        <div className="intergation-operation-container">
          <div className="intergration-header">
            <span className="menu-item-icon">
              <IconLink />
            </span>
            <span className="intergration-header-title">网页链接</span>
          </div>
          <Divider />
          <div className="intergation-body">
            <div className="intergation-body-action">
              <TextArea
                placeholder="输入或粘贴网页链接，每行一个...."
                rows={4}
                autoSize={{
                  minRows: 4,
                  maxRows: 4,
                }}
                value={linkStr}
                onChange={(value) => setLinkStr(value)}
              />
              <Button
                type="primary"
                long
                style={{ marginTop: 16 }}
                onClick={() => {
                  scrapeLink(linkStr);
                }}
              >
                添加
              </Button>
            </div>
            <div className="intergation-body-result">
              <h2 className="intergation-body-result-title">待处理列表</h2>
              <div className="intergation-result-list">
                {scrapeLinkLoading ? <Skeleton /> : null}
                {importResourceStore.scrapeLinks?.length > 0 ? (
                  <List
                    style={{ width: 700, marginBottom: 48, border: 'none' }}
                    dataSource={importResourceStore?.scrapeLinks}
                    render={(item, index) => <RenderItem item={item} key={index} />}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Affix offsetBottom={0} target={() => document.querySelector('.import-resource-right-panel') as HTMLElement}>
        <div className="intergation-footer">
          <div className="footer-location">
            <p className="footer-count text-item">共 {importResourceStore?.scrapeLinks?.length} 个</p>
            <p style={{ margin: '0 8px' }} className="text-item">
              {' '}
              |{' '}
            </p>
            <p className="text-item">保存至 </p>
            <Select
              size="large"
              placeholder="选择保存知识库"
              showSearch
              className={'kg-selector'}
              defaultValue={`${kbId || 'new-collection'}`}
              onInputValueChange={(value) => {
                handleValueChange(value, ['collection']);
              }}
              onChange={(value) => {
                if (!value) return;
                if (value === 'new-collection') {
                  importResourceStore.setSelectedCollectionId('new-collection');
                } else {
                  importResourceStore.setSelectedCollectionId(value);
                }
              }}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  {mode === 'fetch' && hasMore ? (
                    <div className="search-load-more">
                      <Button type="text" loading={isRequesting} onClick={() => loadMore()}>
                        加载更多
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            >
              <Option key="new-collection" value="new-collection">
                新建知识库
              </Option>
              {dataList?.map((item) => (
                <Option key={item?.id} value={item?.id}>
                  <span dangerouslySetInnerHTML={{ __html: item?.title }}></span>
                </Option>
              ))}
            </Select>
          </div>
          <div className="footer-action">
            <Button
              style={{ width: 72, marginRight: 8 }}
              onClick={() => importResourceStore.setImportResourceModalVisible(false)}
            >
              取消
            </Button>
            <Button type="primary" style={{ width: 100 }} onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      </Affix>
    </div>
  );
};

const RenderItem = (props: { item: LinkMeta }) => {
  const importResourceStore = useImportResourceStore();
  const { item } = props;

  return (
    <List.Item
      actions={[
        <Button
          type="text"
          className="assist-action-item"
          onClick={() => {
            window.open(item?.url, '_blank');
          }}
        >
          <IconLink />
        </Button>,
        <Button
          type="text"
          className="assist-action-item"
          onClick={() => {
            const newLinks = importResourceStore?.scrapeLinks?.filter((link) => {
              return link?.key !== item?.key;
            });

            importResourceStore.setScapeLinks(newLinks);
          }}
        >
          <IconClose />
        </Button>,
      ]}
      className="intergation-result-list-item"
    >
      <List.Item.Meta
        avatar={<Avatar shape="square">{<img src={item?.image} style={{ objectFit: 'contain' }} />}</Avatar>}
        title={
          <p className="intergation-result-intro">
            <span className="intergation-result-url" onClick={() => window.open(item?.url, '_blank')}>
              {item?.url}
            </span>
            <p>{item?.isError ? <span className="text-red-500">抓取失败</span> : item?.title}</p>
          </p>
        }
        description={item.description}
      />
    </List.Item>
  );
};
