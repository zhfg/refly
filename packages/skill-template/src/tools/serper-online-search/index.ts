import { Tool } from '@langchain/core/tools';
import { BaseToolParams } from '../../base';
import { SkillEngine } from '../../engine';

export enum LOCALE {
  ZH_CN = 'zh-CN',
  EN = 'en',
}

const DEFAULT_MAX_RESULTS = 10;

export interface SearchOptions {
  locale: string;
  maxResults?: number;
}

interface Props extends SearchOptions {
  query: string;
}

interface SearchResultContext {
  name: string;
  url: string;
  snippet: string;
}

export const serperOnlineSearch = async (props: Props, engine: SkillEngine): Promise<SearchResultContext[]> => {
  const { query, locale, maxResults = DEFAULT_MAX_RESULTS } = props;

  engine.logger.log('SerperOnlineSearch', query, locale);

  let jsonContent: any = [];
  try {
    const queryPayload = JSON.stringify({
      q: query,
      num: maxResults,
      hl: locale?.toLocaleLowerCase(),
      gl: locale?.toLocaleLowerCase() === LOCALE.ZH_CN?.toLocaleLowerCase() ? 'cn' : 'us',
    });

    const res = await fetch('https://google.serper.dev/search', {
      method: 'post',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: queryPayload,
    });
    jsonContent = await res.json();

    // convert to the same format as bing/google
    const contexts = [];
    if (jsonContent.hasOwnProperty('knowledgeGraph')) {
      const url = jsonContent.knowledgeGraph.descriptionUrl || jsonContent.knowledgeGraph.website;
      const snippet = jsonContent.knowledgeGraph.description;
      if (url && snippet) {
        contexts.push({
          name: jsonContent.knowledgeGraph.title || '',
          url: url,
          snippet: snippet,
        });
      }
    }

    if (jsonContent.hasOwnProperty('answerBox')) {
      const url = jsonContent.answerBox.url;
      const snippet = jsonContent.answerBox.snippet || jsonContent.answerBox.answer;
      if (url && snippet) {
        contexts.push({
          name: jsonContent.answerBox.title || '',
          url: url,
          snippet: snippet,
        });
      }
    }
    if (jsonContent.hasOwnProperty('organic')) {
      for (const c of jsonContent.organic) {
        contexts.push({
          name: c.title,
          url: c.link,
          snippet: c.snippet || '',
        });
      }
    }
    return contexts.slice(0, maxResults);
  } catch (e) {
    engine.logger.error(`onlineSearch error encountered: ${e}`);
    return [];
  }
};

export interface SerperSearchParameters extends BaseToolParams {
  /**
   * The search options for the search using the SearchOptions interface
   * from the duck-duck-scrape package.
   */
  searchOptions?: SearchOptions;
  /**
   * The maximum number of results to return from the search.
   * Limiting to 10 to avoid context overload.
   * @default 10
   */
}

export class SerperSearch extends Tool {
  private searchOptions?: SearchOptions;
  private engine: SkillEngine;

  constructor(params: SerperSearchParameters) {
    super(params ?? {});

    const { searchOptions } = params ?? {};
    this.searchOptions = searchOptions;

    this.engine = params.engine;
  }

  static lc_name() {
    return 'SerperSearch';
  }

  name = 'serper_search';

  description =
    'A search engine. Useful for when you need to answer questions about current events. Input should be a search query.';

  async _call(input: string): Promise<string> {
    const results = await serperOnlineSearch({ query: input, ...this.searchOptions }, this.engine);

    return JSON.stringify(results);
  }
}
