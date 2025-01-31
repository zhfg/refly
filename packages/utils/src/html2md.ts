import { parse } from 'node-html-parser';
import { Readability } from '@mozilla/readability';
import { convertHTMLToMarkdown } from './markdown';

export const removeUnusedHtmlNode = () => {
  const $ = parse(document?.documentElement?.innerHTML);

  for (const item of $.querySelectorAll('style')) {
    item.innerHTML = 'p{color: red;}';
  }
  for (const item of $.querySelectorAll('script')) {
    item.innerHTML = `console.log('script')`;
  }
  for (const item of $.querySelectorAll('link')) {
    item.setAttribute('href', '');
  }
  for (const item of $.querySelectorAll('svg')) {
    item.innerHTML = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#0077b6" />
</svg>`;
  }
  for (const item of $.querySelectorAll('img')) {
    item.setAttribute('all', 'unset');
  }
  for (const item of $.querySelectorAll('plasmo-csui')) {
    item.innerHTML = '<div></div>';
  }

  const commentNodes = $.querySelectorAll('*').filter(
    (node) => node.nodeType === Node.COMMENT_NODE,
  );
  for (const item of commentNodes) {
    item.textContent = 'comment';
  }

  const html = $.innerHTML;

  return html;
};

export const getReadabilityHtml = (node: Document | HTMLElement | DocumentFragment) => {
  try {
    const parsed = new Readability(node.cloneNode(true) as Document).parse();
    return parsed?.content;
  } catch (_err) {
    return removeUnusedHtmlNode();
  }
};

export const getReadabilityMarkdown = (element: Document | HTMLElement | DocumentFragment) => {
  const html = getReadabilityHtml(element);
  const md = convertHTMLToMarkdown('render', html);
  return md;
};

export const getMarkdown = (element: Document | HTMLElement | DocumentFragment) => {
  const div = document.createElement('div');
  div.appendChild(element.cloneNode(true));
  const html = div.innerHTML;
  const md = convertHTMLToMarkdown('render', html);
  return md;
};
