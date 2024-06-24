// @ts-ignore
import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token.mjs';
import { MarkdownParser } from 'prosemirror-markdown';
import { schema } from './schema';

function listIsTight(tokens: readonly Token[], i: number) {
  while (++i < tokens.length) if (tokens[i].type != 'listItem_open') return tokens[i].hidden;
  return false;
}

/// A parser parsing unextended [CommonMark](http://commonmark.org/),
/// without inline HTML, and producing a document in the basic schema.
export const defaultMarkdownParser = new MarkdownParser(schema, MarkdownIt('commonmark', { html: false }), {
  blockquote: { block: 'blockquote' },
  paragraph: { block: 'paragraph' },
  listItem: { block: 'listItem' },
  bulletList: {
    block: 'bulletList',
    getAttrs: (_, tokens, i) => ({ tight: listIsTight(tokens, i) }),
  },
  orderedList: {
    block: 'orderedList',
    getAttrs: (tok, tokens, i) => ({
      order: +tok.attrGet('start')! || 1,
      tight: listIsTight(tokens, i),
    }),
  },
  // TODO: 先保障不出错，后续修复
  taskItem: { block: 'taskItem' },
  // TODO: 先保障不出错，后续修复
  taskList: {
    block: 'taskList',
    getAttrs: (_, tokens, i) => ({ tight: listIsTight(tokens, i) }),
  },
  heading: {
    block: 'heading',
    getAttrs: (tok) => ({ level: +tok.tag.slice(1) }),
  },
  codeBlock: { block: 'codeBlock', noCloseToken: true },
  fence: {
    block: 'codeBlock',
    getAttrs: (tok) => ({ params: tok.info || '' }),
    noCloseToken: true,
  },
  hr: { node: 'horizontal_rule' },
  image: {
    node: 'image',
    getAttrs: (tok) => ({
      src: tok.attrGet('src'),
      title: tok.attrGet('title') || null,
      alt: (tok.children![0] && tok.children![0].content) || null,
    }),
  },
  hardbreak: { node: 'hard_break' },

  em: { mark: 'em' },
  strong: { mark: 'strong' },
  link: {
    mark: 'link',
    getAttrs: (tok) => ({
      href: tok.attrGet('href'),
      title: tok.attrGet('title') || null,
    }),
  },
  code_inline: { mark: 'code', noCloseToken: true },
});

export { MarkdownParser };
