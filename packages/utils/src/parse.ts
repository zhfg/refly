import { Source } from '@refly-packages/openapi-schema';

export const safeParseJSON = (value: any, errorCallback?: (e: unknown) => any): any => {
  try {
    return JSON.parse(value);
  } catch (e) {
    if (errorCallback) {
      return errorCallback(e);
    } else {
      return undefined;
    }
  }
};

export const safeStringifyJSON = (value: any, errorCallback?: (e: unknown) => string): string => {
  try {
    return JSON.stringify(value);
  } catch (e) {
    if (errorCallback) {
      return errorCallback(e);
    } else {
      return '';
    }
  }
};

export const safeEqual = (val1, val2): boolean => {
  return val1 && val2 && val1 === val2;
};

export function isJSON(variable: any): boolean {
  if (typeof variable !== 'string' || !variable.startsWith('{') || !variable.endsWith('}')) {
    return false;
  }
  try {
    JSON.parse(variable);
    return true;
  } catch (error) {
    return false;
  }
}

const getParsedCitation = (markdown = '') => {
  return markdown
    ?.replace(/\[\s*([cC])itation/g, '[citation')
    .replace(/\[\[([cC])itation/g, '[citation')
    .replace(/[cC]itation:(\d+)]]/g, 'citation:$1]')
    .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
    .replace(/\[[cC]itation:(\d+)]/g, '[citation]($1)')
    .replace(/[cC]itation\s*:\s*(\d+)\s*]]/g, 'citation:$1]')
    .replace(/\[\s*([cC]itation\s*:\s*\d+)\s*]](?!])/g, `[$1]`)
    .replace(/\[\s*[cC]itation\s*:\s*(\d+)\s*]/g, '[citation]($1)')
    .replace(/【\s*[cC]itation\s*:\s*(\d+)\s*】/g, '[citation]($1)')
    .replace(/\[\[\s*[cC]itation\s*:\s*(\d+)\s*]]/g, '[citation]($1)');
};

export const markdownCitationParse = (markdown: string) => {
  if (typeof markdown !== 'string') {
    return markdown;
  }

  return getParsedCitation(markdown);
};

export function parseMarkdownCitationsAndCanvasTags(content: string, sources: Source[]): string {
  // Remove citation references
  const citationRegex = /\[\s*citation\s*]\s*\(\s*(\d+)\s*\)|\[\s*citation\s*:\s*(\d+)\s*]/g;
  let parsedContent = getParsedCitation(content).replace(citationRegex, '');

  // Remove refly tags and keep their content
  const reflyTagsRegex = {
    thinking: /<reflyThinking\b[^>]*>([\s\S]*?)<\/reflyThinking>/g,
    canvas: /<reflyCanvas\b[^>]*>([\s\S]*?)<\/reflyCanvas>/g,
  };

  // Extract content from thinking tags
  parsedContent = parsedContent.replace(reflyTagsRegex.thinking, (_, content) => {
    return content.trim();
  });

  // Extract content from canvas tags
  parsedContent = parsedContent.replace(reflyTagsRegex.canvas, (_, content) => {
    return content.trim();
  });

  // Remove any remaining unclosed tags
  parsedContent = parsedContent
    .replace(/<reflyThinking\b[^>]*>/g, '')
    .replace(/<reflyCanvas\b[^>]*>/g, '')
    .replace(/<\/reflyThinking>/g, '')
    .replace(/<\/reflyCanvas>/g, '');

  return parsedContent.trim();
}

export function parseMarkdownWithCitations(content: string, sources: Source[]): string {
  // 统一引用格式
  let parsedContent = getParsedCitation(content);

  // 处理统一后的引用格式并收集使用的源
  const citationRegex = /\[\s*citation\s*]\s*\(\s*(\d+)\s*\)|\[\s*citation\s*:\s*(\d+)\s*]/g;
  const usedSources = new Set<number>();

  parsedContent = parsedContent.replace(citationRegex, (_, num) => {
    const index = Number.parseInt(num, 10) - 1;
    const source = sources[index];
    if (source) {
      usedSources.add(index + 1);
      return `[${num}](${source.url})`;
    }
    return `[${num}]`;
  });

  // 添加引用来源
  if (usedSources.size > 0) {
    parsedContent += '\n\n引用来源：\n';
    Array.from(usedSources)
      .sort((a, b) => a - b)
      .forEach((num) => {
        const source = sources[num - 1];
        if (source) {
          parsedContent += `-  ${num}\: [${source.title}](${source.url})\n\n`;
        }
      });
  }

  return parsedContent;
}
