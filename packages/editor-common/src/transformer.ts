import { prosemirrorToYXmlFragment, yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { Node } from '@tiptap/pm/model';
import * as Y from 'yjs';
import { defaultSchema } from './schema';
import { MarkdownSerializer, defaultMarkdownParser, defaultMarkdownSerializer as dms } from 'prosemirror-markdown';

export const markdownSerializer = new MarkdownSerializer(
  {
    ...dms.nodes,
    codeBlock: dms.nodes.code_block,
    horizontalRule: dms.nodes.horizontal_rule,
    bulletList: dms.nodes.bullet_list,
    orderedList: dms.nodes.ordered_list,
    listItem: dms.nodes.list_item,
    hardBreak: dms.nodes.hard_break,
  },
  {
    ...dms.marks,
    bold: dms.marks.strong,
    italic: dms.marks.em,
  },
);

export const state2Markdown = (stateUpdate: Uint8Array) => {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, stateUpdate);
  const xmlFragment = ydoc.getXmlFragment('default');
  const node = yXmlFragmentToProseMirrorRootNode(xmlFragment, defaultSchema);
  return markdownSerializer.serialize(node);
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
