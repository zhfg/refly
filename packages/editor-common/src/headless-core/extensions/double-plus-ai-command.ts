import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { editorEmitter } from '@refly/utils/event-emitter/editor';

export const DoublePlusAICommand = Extension.create({
  name: 'double-plus-ai-command',

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey('double-plus-ai-command'),
      props: {
        handleTextInput: (view, from, to, text) => {
          // 检查输入是否是第二个加号
          if (text === '+' && view.state.doc.textBetween(from - 1, from) === '+') {
            // 删除 "++"
            view.dispatch(view.state.tr.delete(from - 1, to));

            // 触发 AI 菜单
            setTimeout(() => {
              editorEmitter.emit('activeAskAI', true);
            }, 0);

            return true;
          }
          return false;
        },
      },
    });

    return [plugin];
  },
});
