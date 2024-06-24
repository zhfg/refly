export enum LOCALE {
  ZH_CN = 'zh-CN',
  EN = 'en',
}

interface Props {
  query: string;
  locale: LOCALE;
}

interface Logger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

interface Context {
  logger: Logger;
}

const defaultLogger: Logger = {
  log: (...args: any[]) => {
    console.log(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
};

interface SearchResultContext {
  name: string;
  url: string;
  snippet: string;
}

export const SerperOnlineSearch = async (
  props: Props,
  ctx: Context = { logger: defaultLogger },
): Promise<SearchResultContext[]> => {
  const { query, locale } = props;

  let jsonContent: any = [];
  try {
    const REFERENCE_COUNT = 8;
    const queryPayload = JSON.stringify({
      q: query,
      num: REFERENCE_COUNT,
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
    return contexts.slice(0, REFERENCE_COUNT);
  } catch (e) {
    ctx.logger.error(`onlineSearch error encountered: ${e}`);
    return [];
  }
};
