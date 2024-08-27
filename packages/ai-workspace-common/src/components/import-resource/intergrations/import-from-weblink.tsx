import { Button, Divider, Empty, Input, List, Avatar, Message as message, Affix, Spin } from '@arco-design/web-react';
import { IconLink, IconClose } from '@arco-design/web-react/icon';
import { useEffect, useState } from 'react';

// utils
import { isUrl } from '@refly/utils/isUrl';
import { genUniqueId } from '@refly-packages/utils/id';
import { LinkMeta, useImportResourceStore } from '@refly-packages/ai-workspace-common/stores/import-resource';
// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { UpsertResourceRequest } from '@refly/openapi-schema';
import { SearchSelect } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
import { useReloadListState } from '@refly-packages/ai-workspace-common/stores/reload-list-state';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';

const { TextArea } = Input;

export const ImportFromWeblink = () => {
  const [linkStr, setLinkStr] = useState('');
  const importResourceStore = useImportResourceStore();
  const reloadListState = useReloadListState();

  const [queryParams] = useSearchParams();
  const kbId = queryParams.get('kbId');

  const { selectedCollectionId, scrapeLinks = [] } = importResourceStore;

  console.log('select collection id', selectedCollectionId);

  const [saveLoading, setSaveLoading] = useState(false);

  const scrapeSingleUrl = async (key: string, url: string) => {
    const { scrapeLinks } = useImportResourceStore.getState();
    try {
      const { data, error } = await getClient().scrape({ body: { url } });

      if (error) {
        throw error;
      }

      const { title, description, image } = data?.data ?? {};

      const newLinks = scrapeLinks.map((link) => {
        if (link?.key === key) {
          link.title = title;
          link.description = description;
          link.image = image;
          link.isHandled = true;
        }

        return link;
      });
      importResourceStore.setScrapeLinks(newLinks);
    } catch (err) {
      console.log('fetch url error, silent ignore');
      const newLinks = scrapeLinks.map((link) => {
        if (link?.key === key) {
          link.isError = true;
        }

        return link;
      });
      importResourceStore.setScrapeLinks(newLinks);
    }
  };

  const scrapeLink = async (linkStr: string) => {
    try {
      const links: LinkMeta[] = linkStr
        .split('\n')
        .filter((str) => str && isUrl(str))
        .map((url) => ({
          url: url.trim(),
          key: genUniqueId(),
          isHandled: false,
        }));

      if (links?.length === 0) {
        message.warning('请输入有效的网页链接，以 http 或 https 开头');
        return;
      }

      importResourceStore.setScrapeLinks(scrapeLinks.concat(links));
      setLinkStr('');

      // Scrape the link information
      await Promise.all(links.map((link) => scrapeSingleUrl(link.key, link.url)));
    } catch (err) {
      console.error(err);
    }
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
        title: link?.title,
        data: {
          url: link?.url,
          title: link?.title,
        },
        collectionId: selectedCollectionId,
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
      importResourceStore.setScrapeLinks([]);
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
                placeholder="输入或粘贴有效的网页链接，每行一个...."
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
                disabled={!linkStr}
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
                {scrapeLinks?.length > 0 ? (
                  <List
                    style={{ width: 700, marginBottom: 48, border: 'none' }}
                    dataSource={scrapeLinks}
                    render={(item, index) => <RenderItem item={item} key={index} />}
                  />
                ) : (
                  <Empty />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Affix offsetBottom={0} target={() => document.querySelector('.import-resource-right-panel') as HTMLElement}>
        <div className="intergation-footer">
          <div className="footer-location">
            <p className="footer-count text-item">共 {scrapeLinks?.length} 个</p>
            <p style={{ margin: '0 8px' }} className="text-item">
              {' '}
              |{' '}
            </p>
            <p className="text-item">保存至 </p>
            <SearchSelect
              domain="collection"
              className="kg-selector"
              allowCreateNewEntity
              onChange={(value) => {
                if (!value) return;
                importResourceStore.setSelectedCollectionId(value);
              }}
            />
          </div>
          <div className="footer-action">
            <Button
              style={{ width: 72, marginRight: 8 }}
              onClick={() => importResourceStore.setImportResourceModalVisible(false)}
            >
              取消
            </Button>
            <Button
              type="primary"
              style={{ width: 100 }}
              onClick={handleSave}
              disabled={scrapeLinks.length === 0}
              loading={saveLoading}
            >
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
    <Spin loading={!item.isHandled && !item.isError} style={{ width: '100%', minHeight: 80 }}>
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

              importResourceStore.setScrapeLinks(newLinks);
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
            <div className="intergation-result-intro">
              <p>
                <span className="intergation-result-url" onClick={() => window.open(item?.url, '_blank')}>
                  {item?.url}
                </span>
              </p>
              <p>{item?.isError ? <span className="text-red-500">抓取失败</span> : item?.title}</p>
            </div>
          }
          description={item.description}
        />
      </List.Item>
    </Spin>
  );
};
