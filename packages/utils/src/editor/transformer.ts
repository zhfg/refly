import { prosemirrorToYXmlFragment, yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { Node, Schema } from '@tiptap/pm/model';
import * as Y from 'yjs';
import { tables } from 'turndown-plugin-gfm';
import TurndownService from 'turndown';
import { defaultSchema } from './schema';
import { MarkdownSerializer, defaultMarkdownSerializer } from './to_markdown';
import { defaultMarkdownParser, MarkdownParser } from './from_markdown';

export const state2Markdown = (stateUpdate: Uint8Array) => {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, stateUpdate);
  const xmlFragment = ydoc.getXmlFragment('default');
  const node = yXmlFragmentToProseMirrorRootNode(xmlFragment, defaultSchema);
  return defaultMarkdownSerializer.serialize(node);
};

export const parseMarkdown = (markdown: string) => {
  return defaultMarkdownParser.parse(markdown);
};

export const node2Ydoc = (node: Node) => {
  const ydoc = new Y.Doc();
  prosemirrorToYXmlFragment(node, ydoc.getXmlFragment('default'));
  return ydoc;
};

export const ydoc2StateUpdate = (ydoc: Y.Doc) => {
  return Y.encodeStateAsUpdate(ydoc);
};

export const markdown2StateUpdate = (markdown: string) => {
  const node = parseMarkdown(markdown);
  const ydoc = node2Ydoc(node);
  return ydoc2StateUpdate(ydoc);
};

export type FormatMode =
  | 'render' // For markdown rendering
  | 'ingest' // For consumption by LLMs
  | 'vanilla'; // Without any processing;

export function tidyMarkdown(markdown: string): string {
  // Step 1: Handle complex broken links with text and optional images spread across multiple lines
  let normalizedMarkdown = markdown.replace(/\[\s*([^\]\n]+?)\s*\]\s*\(\s*([^)]+)\s*\)/g, (match, text, url) => {
    // Remove internal new lines and excessive spaces within the text
    text = text.replace(/\s+/g, ' ').trim();
    url = url.replace(/\s+/g, '').trim();
    return `[${text}](${url})`;
  });

  normalizedMarkdown = normalizedMarkdown.replace(
    /\[\s*([^\]\n!]*?)\s*\n*(?:!\[([^\]]*)\]\((.*?)\))?\s*\n*\]\s*\(\s*([^)]+)\s*\)/g,
    (match, text, alt, imgUrl, linkUrl) => {
      // Normalize by removing excessive spaces and new lines
      text = text.replace(/\s+/g, ' ').trim();
      alt = alt ? alt.replace(/\s+/g, ' ').trim() : '';
      imgUrl = imgUrl ? imgUrl.replace(/\s+/g, '').trim() : '';
      linkUrl = linkUrl.replace(/\s+/g, '').trim();
      if (imgUrl) {
        return `[${text} ![${alt}](${imgUrl})](${linkUrl})`;
      } else {
        return `[${text}](${linkUrl})`;
      }
    },
  );

  // Step 2: Normalize regular links that may be broken across lines
  normalizedMarkdown = normalizedMarkdown.replace(/\[\s*([^\]]+)\]\s*\(\s*([^)]+)\)/g, (match, text, url) => {
    text = text.replace(/\s+/g, ' ').trim();
    url = url.replace(/\s+/g, '').trim();
    return `[${text}](${url})`;
  });

  // Step 3: Remove leading spaces from each line
  normalizedMarkdown = normalizedMarkdown.replace(/^[ \t]+/gm, '');

  // Step 4: Replace more than two consecutive empty lines with exactly two empty lines
  normalizedMarkdown = normalizedMarkdown.replace(/\n{3,}/g, '\n\n');

  return normalizedMarkdown.trim();
}

/**
 * Clean markdown for consumption by LLM, by removing images and links.
 */
export function cleanMarkdownForIngest(markdown: string): string {
  // Remove images
  let plainText = markdown.replace(/!\[.*?\]\(.*?\)/g, '');

  // Convert links to plain text
  plainText = plainText.replace(/\[(.+?)\]\(.*?\)/g, '$1');

  return plainText;
}

const getTurndown = (mode: FormatMode) => {
  const turnDownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });
  if (mode === 'render') {
    turnDownService.addRule('remove-irrelevant', {
      filter: ['meta', 'style', 'script', 'noscript', 'link', 'textarea'],
      replacement: () => '',
    });
  } else if (mode === 'ingest') {
    turnDownService.addRule('remove-irrelevant', {
      filter: ['meta', 'style', 'script', 'noscript', 'link', 'textarea', 'img'],
      replacement: () => '',
    });
    turnDownService.addRule('unlink', {
      filter: ['a'],
      replacement: (content, node) => node.textContent,
    });
  }

  return turnDownService;
};

export const convertHTMLToMarkdown = (mode: FormatMode, html: string): string => {
  const turnDownPlugins = [tables];
  const toBeTurnedToMd = html;
  let turnDownService = getTurndown(mode);
  for (const plugin of turnDownPlugins) {
    turnDownService = turnDownService.use(plugin);
  }

  let contentText = '';
  if (toBeTurnedToMd) {
    try {
      contentText = turnDownService.turndown(toBeTurnedToMd).trim();
    } catch (err) {
      console.error(`Turndown failed to run, retrying without plugins: ${err}`);
      const vanillaTurnDownService = getTurndown('vanilla');
      try {
        contentText = vanillaTurnDownService.turndown(toBeTurnedToMd).trim();
      } catch (err2) {
        console.error(`Turndown failed to run, giving up: ${err2}`);
      }
    }
  }

  if (!contentText || (contentText.startsWith('<') && contentText.endsWith('>') && toBeTurnedToMd !== html)) {
    try {
      contentText = turnDownService.turndown(html);
    } catch (err) {
      console.warn(`Turndown failed to run, retrying without plugins`, { err });
      const vanillaTurnDownService = getTurndown('vanilla');
      try {
        contentText = vanillaTurnDownService.turndown(html);
      } catch (err2) {
        console.warn(`Turndown failed to run, giving up`, { err: err2 });
      }
    }
  }

  return tidyMarkdown(contentText || '').trim();
};
