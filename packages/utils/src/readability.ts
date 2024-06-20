import { Readability } from '@mozilla/readability';
import { removeUnusedHtmlNode } from './removeUnusedHtmlNode';

export const getReadabilityHtml = () => {
  try {
    const parsed = new Readability(document.cloneNode(true) as Document).parse();
    return parsed?.content;
  } catch (err) {
    return removeUnusedHtmlNode();
  }
};
