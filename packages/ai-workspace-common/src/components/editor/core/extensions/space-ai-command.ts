import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { editorEmitter } from '@refly/utils/event-emitter/editor';

export const SpaceAICommand = Extension.create({
  name: 'space-ai-command',

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey('space-ai-command'),
      props: {
        handleKeyDown: (view, event) => {
          // 检查是否按下空格键
          if (event.key !== ' ') return false;

          const { state } = view;
          const { selection, doc } = state;
          const { empty, from } = selection;

          // 获取当前节点
          const node = doc.nodeAt(from);
          const parentNode = doc.resolve(from).parent;

          // 检查是否在空的段落中
          const isEmptyParagraph =
            parentNode.type.name === 'paragraph' && parentNode.content.size === 0 && empty;

          if (isEmptyParagraph) {
            // 阻止默认的空格输入
            event.preventDefault();

            const docId = view.dom.closest('[data-doc-id]')?.getAttribute('data-doc-id');

            // 触发 AI 功能
            editorEmitter.emit('activeAskAI', { value: true, docId });

            return true;
          }

          return false;
        },
      },
    });

    return [plugin];
  },
});
