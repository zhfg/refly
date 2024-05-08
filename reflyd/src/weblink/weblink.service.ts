import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User, Weblink } from '@prisma/client';
import { Queue } from 'bull';
import { LRUCache } from 'lru-cache';
import { InjectQueue } from '@nestjs/bull';
import { Document } from '@langchain/core/documents';

import { PrismaService } from '../common/prisma.service';
import { MinioService } from '../common/minio.service';
import { RAGService, ContentAvroType, PARSER_VERSION } from '../rag/rag.service';
import { AigcService } from '../aigc/aigc.service';
import { RedisService } from '../common/redis.service';
import { LlmService } from '../llm/llm.service';
import { WebLinkDTO, WeblinkData } from './weblink.dto';
import { getExpectedTokenLenContent } from '../utils/token';
import { PageMeta, Source } from '../types/weblink';
import { PROCESS_LINK_BY_USER_CHANNEL, PROCESS_LINK_CHANNEL, QUEUE_WEBLINK } from '../utils/const';
import { streamToBuffer, streamToString } from '../utils/stream';
import { genLinkID, sha256Hash } from '../utils/id';
import { ContentData } from '../common/weaviate.dto';
import { hasUrlRedirected, normalizeURL } from '../utils/url';
import { TaskResponse } from '../conversation/conversation.dto';

@Injectable()
export class WeblinkService {
  private logger = new Logger(WeblinkService.name);

  private cache: LRUCache<string, WeblinkData>; // url -> weblink data
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private minio: MinioService,
    private configService: ConfigService,
    private llmService: LlmService,
    private ragService: RAGService,
    private aigcService: AigcService,
    @InjectQueue(QUEUE_WEBLINK) private indexQueue: Queue<WebLinkDTO>,
  ) {
    this.cache = new LRUCache({
      max: 1000,
    });
    this.bucketName = this.configService.getOrThrow('minio.weblinkBucket');
  }

  async enqueueProcessTask(link: WebLinkDTO) {
    return this.indexQueue.add(PROCESS_LINK_CHANNEL, link);
  }

  async enqueueProcessByUserTask(link: WebLinkDTO) {
    return this.indexQueue.add(PROCESS_LINK_BY_USER_CHANNEL, link);
  }

  async findFirstWeblink(where: { url?: string; linkId?: string }) {
    return this.prisma.weblink.findFirst({ where });
  }

  /**
   * Preprocess and filter links, then send to processing queue
   * @param uid user id
   * @param links link history data
   */
  async storeLinks(userId: number, links: WebLinkDTO[]) {
    if (!links) return;

    // Aggregate links (pick the last visit one)
    const linkMap = new Map<string, WebLinkDTO>();
    links.forEach((link) => {
      // TODO: pre filtering (with bloom filter, etc.)
      const url = normalizeURL(link.url);
      if (!linkMap.has(url)) {
        link.userId = userId;
        return linkMap.set(url, link);
      }
      if (link.lastVisitTime > linkMap.get(link.url).lastVisitTime) {
        linkMap.get(url).lastVisitTime = link.lastVisitTime;
      }
      if (link.visitCount) {
        linkMap.get(url).visitCount += link.visitCount;
      }
      if (link.readTime) {
        linkMap.get(url).readTime += link.readTime;
      }
    });

    // Send to queue in a non-block style
    linkMap.forEach((link) => this.enqueueProcessByUserTask(link));
  }

  async getUserHistory(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWeblinkWhereUniqueInput;
    where?: Prisma.UserWeblinkWhereInput;
    orderBy?: Prisma.WeblinkOrderByWithRelationInput;
  }) {
    return this.prisma.userWeblink.findMany(params);
  }

  /**
   * Parse the content of a webpage link.
   * NOTE: the data could be empty, please check the return value
   *
   * @param {string} url - The URL of the webpage to parse
   * @return {Promise<Document>} A Promise that resolves to the parsed document
   */
  async readWebLinkContent(url: string): Promise<WeblinkData> {
    // Check if the document is in the cache
    if (this.cache.has(url)) {
      this.logger.log(`in-mem cache hit: ${url}`);
      return this.cache.get(url);
    }

    // Check if the document is in the database
    const weblink = await this.prisma.weblink.findUnique({
      select: { storageKey: true, parsedDocStorageKey: true, pageMeta: true },
      where: { url },
    });
    if (weblink?.storageKey && weblink?.parsedDocStorageKey) {
      this.logger.log(`found valid weblink from db: ${JSON.stringify(weblink)}`);
      const [htmlStream, docStream] = await Promise.all([
        this.minio.getObject(this.bucketName, weblink.storageKey),
        this.minio.getObject(this.bucketName, weblink.parsedDocStorageKey),
      ]);
      const [html, doc] = await Promise.all([
        streamToString(htmlStream),
        streamToString(docStream),
      ]);
      const data = {
        html,
        doc: {
          pageContent: doc,
          metadata: JSON.parse(weblink.pageMeta || '{}'),
        },
      };
      this.cache.set(url, data);
      return data;
    }

    // Finally tries to fetch the content from the web
    const snapshot = await this.ragService.crawl(url);

    let doc: Document<PageMeta>;
    if (snapshot.html && !hasUrlRedirected(url, snapshot.href)) {
      doc = await this.ragService.formatSnapshot('ingest', snapshot, new URL(url));
      this.cache.set(url, { html: snapshot.parsed?.content, doc });
    }

    return { html: snapshot.html, doc };
  }

  /**
   * Directly parse html content.
   * @param pageContent raw html page content
   * @returns parsed markdown document
   */
  async directParseWebLinkContent(link: WebLinkDTO): Promise<WeblinkData> {
    try {
      const stream = await this.minio.getObject(this.bucketName, link.storageKey);
      const content = await streamToString(stream);

      const doc = await this.ragService.formatSnapshot(
        'ingest',
        { html: content, title: link.title, href: link.origin },
        new URL(link.url),
      );
      const data = { html: content, doc };
      this.cache.set(link.url, data);

      return data;
    } catch (err) {
      this.logger.error(`[directParseWebLinkContent] process url ${link.url} failed: ${err.trace}`);
      return null;
    }
  }

  /**
   * Parse multiple weblinks concurrently.
   * @param weblinkList input weblinks
   * @returns langchain documents
   */
  async readMultiWeblinks(weblinkList: Source[]): Promise<Document<PageMeta>[]> {
    // 处理 token 窗口，一共给 12K 窗口用于问答，平均分到每个网页，保障可用性
    const avgTokenLen = 12000 / weblinkList?.length;

    const results = await Promise.all<Document<PageMeta>[]>(
      weblinkList.map(async (item) => {
        // If selections are provided, use the selected content
        if (item.selections?.length > 0) {
          return item.selections.map(({ content }) => ({
            pageContent: content,
            metadata: item.metadata,
          }));
        }

        // Else read the whole document
        const { doc } = await this.readWebLinkContent(item.metadata?.source);
        if (!doc) return [];
        const { pageContent, metadata } = doc;
        return [
          {
            pageContent: getExpectedTokenLenContent(pageContent, avgTokenLen) || '',
            metadata,
          },
        ];
      }),
    );

    return results.flat();
  }

  async saveChunkEmbeddingsForUser(
    user: Pick<User, 'id' | 'uid' | 'vsTenantCreated'>,
    urls: string[],
  ) {
    // const [uwbs, weblinks] = await Promise.all([
    //   this.prisma.userWeblink.findMany({
    //     where: { userId: user.id, url: { in: urls } },
    //   }),
    //   this.prisma.weblink.findMany({
    //     select: { url: true, chunkStorageKey: true },
    //     where: { url: { in: urls } },
    //   }),
    // ]);

    // // calculate urls not saved by user
    // const unsavedWeblinks = weblinks.filter(({ url }) => !uwbs.some((uwb) => uwb.url === url));

    // if (unsavedWeblinks.length === 0) {
    //   this.logger.log(`user ${user.uid} has all weblinks saved: ${urls}`);
    //   return;
    // }

    // TODO: 减少不必要的重复插入
    const weblinks = await this.prisma.weblink.findMany({
      select: { url: true, chunkStorageKey: true },
      where: { url: { in: urls } },
    });

    await Promise.all(
      weblinks.map(async ({ url, chunkStorageKey }) => {
        if (!chunkStorageKey) {
          // techically this cannot happen
          this.logger.error(`chunkStorageKey is empty: ${chunkStorageKey}, url: ${url}`);
          return;
        }
        const stream = await this.minio.getObject(this.bucketName, chunkStorageKey);
        const content = ContentAvroType.fromBuffer(await streamToBuffer(stream)) as ContentData;
        return this.ragService.saveDataForUser(user, content);
      }),
    );

    // 更新向量库租户创建状态
    if (!user.vsTenantCreated) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { vsTenantCreated: true },
      });
    }

    this.logger.log(
      `save chunk embeddings for user ${user.uid} success, urls: ` +
        JSON.stringify(weblinks.map(({ url }) => url)),
    );
  }

  async saveWeblinkUserMarks(param: {
    userId: number;
    weblinkList: Source[];
    extensionVersion?: string;
  }) {
    const { userId, weblinkList, extensionVersion = '' } = param;
    const weblinkWithSelectors = weblinkList.filter((weblink) => weblink.selections?.length > 0);

    if (weblinkWithSelectors.length <= 0) return;

    const weblinks = await this.prisma.weblink.findMany({
      select: { id: true, url: true },
      where: {
        url: { in: weblinkWithSelectors.map((item) => item.metadata.source) },
      },
    });
    const weblinkIdMap = weblinks.reduce((map, item) => {
      map.set(item.url, item.id);
      return map;
    }, new Map<string, number>());
    this.logger.log(`weblinkIdMap: ${JSON.stringify(weblinkIdMap)}`);

    return Promise.all(
      weblinkList.map(async (item) => {
        if (item.selections?.length > 0) {
          const url = item.metadata.source;
          if (!weblinkIdMap.has(url)) return;

          return this.prisma.weblinkUserMark.createMany({
            data: item.selections.map((selector) => ({
              userId,
              weblinkId: weblinkIdMap.get(url),
              linkHost: new URL(url).hostname,
              selector: selector.xPath,
              markType: '',
              extensionVersion,
            })),
          });
        }
      }),
    );
  }

  async updateUserWeblink(link: WebLinkDTO, weblink: Weblink) {
    if (!link.userId) {
      this.logger.log(`drop job due to missing user id: ${link}`);
      return;
    }

    // 更新访问记录
    return this.prisma.userWeblink.upsert({
      where: {
        userId_url: {
          userId: link.userId,
          url: link.url,
        },
      },
      create: {
        url: link.url,
        weblinkId: weblink.id,
        origin: link.origin,
        userId: link.userId,
        originPageUrl: link.originPageUrl,
        originPageTitle: link.originPageTitle,
        originPageDescription: link.originPageDescription,
        lastVisitTime: !!link.lastVisitTime ? new Date(link.lastVisitTime) : new Date(),
        visitTimes: link.visitCount || 1,
        totalReadTime: link.readTime || 0,
      },
      update: {
        lastVisitTime: !!link.lastVisitTime ? new Date(link.lastVisitTime) : new Date(),
        visitTimes: { increment: link.visitCount || 1 },
        totalReadTime: { increment: link.readTime || 0 },
      },
    });
  }

  async uploadHTMLToMinio(link: WebLinkDTO, html: string): Promise<string> {
    if (link.storageKey) {
      return link.storageKey;
    }

    const storageKey = `html/${sha256Hash(link.url)}.html`;

    const res = await this.minio.putObject(
      this.configService.get('minio.weblinkBucket'),
      storageKey,
      html,
    );
    this.logger.log('upload html to minio res: ' + JSON.stringify(res));

    return storageKey;
  }

  async uploadParsedDocToMinio(link: WebLinkDTO, doc: Document<PageMeta>): Promise<string> {
    const parsedDocStorageKey = `docs/${sha256Hash(link.url)}.md`;
    const res = await this.minio.putObject(
      this.configService.get('minio.weblinkBucket'),
      parsedDocStorageKey,
      doc.pageContent,
    );
    this.logger.log('upload parsed doc to minio res: ' + JSON.stringify(res));

    return parsedDocStorageKey;
  }

  /**
   * Chunking and embedding with idempotency when chunking failed or parser version is outdated
   * @param weblink
   * @param doc
   * @returns
   */
  async genWeblinkChunkEmbedding(weblink: Weblink, doc: Document<PageMeta>): Promise<Weblink> {
    if (
      weblink.chunkStorageKey &&
      weblink.chunkStatus === 'finish' &&
      weblink.parserVersion === PARSER_VERSION
    ) {
      this.logger.log(`weblink already indexed: ${weblink.url}, skip`);
      return weblink;
    }

    // 并发控制，妥善处理多个并发请求处理同一个 url 的情况
    const releaseLock = await this.redis.acquireLock(`weblink:index:${weblink.url}`);
    if (!releaseLock) {
      this.logger.log(`acquire index lock failed for weblink: ${weblink.url}`);
      return weblink;
    }

    this.logger.log(`start to index weblink: ${weblink.url}`);

    try {
      const dataObjs = await this.ragService.indexContent(doc);

      const buf = ContentAvroType.toBuffer({ chunks: dataObjs });
      const chunkStorageKey = `chunks/${sha256Hash(weblink.url)}-${PARSER_VERSION}.avro`;
      const res = await this.minio.putObject(
        this.configService.get('minio.weblinkBucket'),
        chunkStorageKey,
        buf,
      );
      this.logger.log(`upload ${dataObjs.length} chunk(s) to minio res: ` + JSON.stringify(res));

      return this.prisma.weblink.update({
        where: { id: weblink.id },
        data: { chunkStorageKey, parserVersion: PARSER_VERSION, chunkStatus: 'finish' },
      });
    } catch (err) {
      this.logger.error(`index weblink failed: ${err}`);
      return this.prisma.weblink.update({
        where: { id: weblink.id },
        data: { chunkStatus: 'failed' },
      });
    } finally {
      await releaseLock();
    }
  }

  /**
   * Extract content metadata for weblink.
   * @param weblink
   * @param doc
   * @returns
   */
  async extractWeblinkContentMeta(weblink: Weblink, doc: Document<PageMeta>): Promise<Weblink> {
    if (Object.keys(JSON.parse(weblink.contentMeta || '{}')).length > 0) {
      return weblink;
    }

    // 并发控制，妥善处理多个并发请求处理同一个 url 的情况
    const releaseLock = await this.redis.acquireLock(`weblink:content_meta:${weblink.url}`);
    if (!releaseLock) {
      this.logger.log(`acquire lock failed for weblink: ${weblink.url}`);
      return weblink;
    }

    // 提取网页分类打标数据 with LLM
    // TODO: need add locale
    this.logger.log(`start to extract content meta for weblink: ${weblink.url}`);
    const meta = await this.llmService.extractContentMeta(doc);
    if (!meta?.topics || !meta?.topics[0].key) {
      this.logger.log(`invalid meta for ${weblink.url}: ${JSON.stringify(meta)}`);
      return weblink;
    }

    return this.prisma.weblink.update({
      where: { id: weblink.id },
      data: { contentMeta: JSON.stringify(meta) },
    });
  }

  /**
   * Connect weblink with user.
   * @param link
   */
  async processLinkByUser(link: WebLinkDTO) {
    if (link.retryTimes >= 20) {
      this.logger.error(`processLinkByUser: retry times exceed limit: ${link.url}`);
      return;
    }

    const weblink = await this.findFirstWeblink({ url: link.url });

    // If weblink not ready, then retry processing the link and re-queue this task
    if (!weblink || !isWeblinkReady(weblink)) {
      await this.enqueueProcessTask(link);
      await new Promise((r) => setTimeout(r, 2000));
      await this.enqueueProcessByUserTask({ ...link, retryTimes: link.retryTimes + 1 });
      return;
    }

    const { doc } = await this.readWebLinkContent(weblink.url);

    if (!doc) {
      this.logger.warn(`[processLinkByUser] doc is empty for ${weblink.url}, skip`);
      return;
    }

    // 处理单个用户的访问记录
    const [uwb, user] = await Promise.all([
      this.updateUserWeblink(link, weblink),
      this.prisma.user.findUnique({ where: { id: link.userId } }),
    ]);

    await Promise.all([
      this.saveChunkEmbeddingsForUser(user, [link.url]),
      this.aigcService.runContentFlow({ uwb, weblink, doc }),
    ]);
  }

  async updateWeblinkStorageKey(
    weblink: Weblink,
    link: WebLinkDTO,
    data: WeblinkData,
  ): Promise<Weblink> {
    if (weblink.storageKey && weblink.parsedDocStorageKey && weblink.parseStatus === 'finish') {
      return;
    }

    // 并发控制，妥善处理多个并发请求处理同一个 url 的情况
    const releaseLock = await this.redis.acquireLock(`weblink:parse:${link.url}`);
    if (!releaseLock) {
      this.logger.log(`acquire lock failed for weblink: ${link.url}`);
      return weblink;
    }

    const { html, doc } = data;

    try {
      // Upload parsed doc to minio
      const [storageKey, parsedDocStorageKey] = await Promise.all([
        this.uploadHTMLToMinio(link, html),
        this.uploadParsedDocToMinio(link, doc),
      ]);

      return this.prisma.weblink.update({
        where: { id: weblink.id },
        data: {
          storageKey,
          parsedDocStorageKey,
          parseStatus: 'finish',
          parseSource: link.storageKey ? 'clientUpload' : 'serverCrawl',
        },
      });
    } catch (err) {
      await this.prisma.weblink.update({
        where: { id: weblink.id },
        data: { parseStatus: 'failed' },
      });
    } finally {
      await releaseLock();
    }
  }

  async updateWeblinkSummary(url: string, taskRes: TaskResponse) {
    const { answer, relatedQuestions } = taskRes;
    return this.prisma.weblink.update({
      where: { url },
      data: { summary: answer, relatedQuestions },
    });
  }

  /**
   * 解析网页统一入口，保证并发安全，保证幂等性.
   * @param link
   * @returns
   */
  async processLink(link: WebLinkDTO): Promise<Weblink> {
    link.url = normalizeURL(link.url);
    this.logger.log(`process link from queue: ${JSON.stringify(link)}`);

    let weblink: Weblink;
    let doc: Document<PageMeta>;

    try {
      weblink = await this.prisma.weblink.upsert({
        where: { url: link.url },
        create: {
          url: link.url,
          linkId: genLinkID(),
          chunkStatus: 'processing',
          parseStatus: 'processing',
          pageContent: '', // deprecated, always empty
          pageMeta: '{}',
          contentMeta: '{}',
          lastParseTime: new Date(),
        },
        update: {},
      });

      if (!isWeblinkReady(weblink)) {
        // Fetch doc and store in cache for later use
        const data =
          this.cache.get(link.url) ||
          (link.storageKey
            ? await this.directParseWebLinkContent(link)
            : await this.readWebLinkContent(link.url));
        if (!data?.doc) {
          this.logger.warn(`cannot parse web link content: ${link.url}, mark as failed`);
          return this.prisma.weblink.update({
            where: { id: weblink.id },
            data: { parseStatus: 'failed', chunkStatus: 'failed' },
          });
        }

        doc = data.doc;

        await Promise.all([
          this.prisma.weblink.update({
            where: { id: weblink.id },
            data: { pageMeta: JSON.stringify(doc.metadata) },
          }),
          this.updateWeblinkStorageKey(weblink, link, data),
          this.genWeblinkChunkEmbedding(weblink, doc),
          this.extractWeblinkContentMeta(weblink, doc),
        ]);
      }
    } catch (err) {
      this.logger.error(`process weblink err: ${err}`);
      await this.prisma.weblink.update({
        where: { url: link.url },
        data: { parseStatus: 'failed', chunkStatus: 'failed' },
      });
    }

    return weblink;
  }
}

function isWeblinkReady(weblink: Weblink): boolean {
  return (
    weblink.storageKey &&
    weblink.parsedDocStorageKey &&
    weblink.chunkStorageKey &&
    weblink.parseStatus === 'finish' &&
    weblink.chunkStatus === 'finish' &&
    weblink.parserVersion === PARSER_VERSION &&
    Object.keys(JSON.parse(weblink.contentMeta || '{}')).length > 0
  );
}
