import { MarkdownParser, defaultMarkdownParser } from 'prosemirror-markdown';
import { prosemirrorToYXmlFragment, yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { Node } from '@tiptap/pm/model';
import * as Y from 'yjs';

export const parser = new MarkdownParser(
  defaultMarkdownParser.schema,
  defaultMarkdownParser.tokenizer,
  defaultMarkdownParser.tokens,
);

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
