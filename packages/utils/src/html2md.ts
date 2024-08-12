import { parse } from 'node-html-parser';
import { Readability } from '@mozilla/readability';
import { convertHTMLToMarkdown } from './editor';

export const removeUnusedHtmlNode = () => {
  const $ = parse(document?.documentElement?.innerHTML);

  $.querySelectorAll('style').map((item) => (item.innerHTML = 'p{color: red;}'));
  $.querySelectorAll('script').map((item) => (item.innerHTML = `console.log('script')`));
  $.querySelectorAll('link').map((item) => item.setAttribute('href', ''));
  $.querySelectorAll('svg').map(
    (item) =>
      (item.innerHTML = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#0077b6" />
</svg>`),
  );
  $.querySelectorAll('img').map((item) => item.setAttribute('all', 'unset'));
  $.querySelectorAll('plasmo-csui').map((item) => (item.innerHTML = `<div></div>`));
  $.querySelectorAll('*')
    .filter((node) => node.nodeType === Node.COMMENT_NODE)
    .map((item) => (item.textContent = 'comment'));

  const html = $.innerHTML;

  return html;
};

export const getReadabilityHtml = (node: Document | HTMLElement | DocumentFragment) => {
  try {
    const parsed = new Readability(node.cloneNode(true) as Document).parse();
    return parsed?.content;
  } catch (err) {
    return removeUnusedHtmlNode();
  }
};

export const getMarkdown = (element: Document | HTMLElement | DocumentFragment) => {
  const html = getReadabilityHtml(element);
  const md = convertHTMLToMarkdown('render', html);
  return md;
};
