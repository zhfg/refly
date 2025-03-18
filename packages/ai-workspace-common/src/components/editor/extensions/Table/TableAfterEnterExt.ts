import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// ensure there's always a paragraph after tables when the table is the last node in the document
export const ParagraphAfterTable = Extension.create({
  name: 'paragraphAfterTable',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('paragraphAfterTable'),

        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const { doc, tr, schema } = newState;
          let modified = false;

          doc.descendants((node, pos) => {
            if (node.type.name === 'table') {
              const endPos = pos + node.nodeSize;
              const $endPos = doc.resolve(endPos);
              const afterNode = $endPos.nodeAfter;

              // Check if this is the last node in the document
              const isLastNode = endPos === doc.content.size;

              // Only add paragraph if this is the last node in the document and there's no paragraph after it
              if (isLastNode && (!afterNode || afterNode.type.name !== 'paragraph')) {
                tr.insert(endPos, schema.nodes.paragraph.create());
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
