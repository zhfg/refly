import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { useDocumentStoreShallow } from '../stores/document';
import { useActionResultStoreShallow } from '../stores/action-result';
import { parseMarkdownCitationsAndCanvasTags } from '@refly/utils/parse';
import { EditorOperation, editorEmitter } from '@refly-packages/utils/event-emitter/editor';
import { Source } from '@refly/openapi-schema';

export const useInsertToDocument = (resultId: string) => {
  const { t } = useTranslation();
  const { editor } = useDocumentStoreShallow((state) => ({
    editor: state.editor,
  }));

  const { result } = useActionResultStoreShallow((state) => ({
    result: state.resultMap[resultId],
  }));

  return useCallback(
    (operation: EditorOperation = 'insertBlow') => {
      if (!result?.content) {
        message.warning(t('knowledgeBase.context.noContent'));
        return;
      }

      // Parse content with citations
      const parsedContent = parseMarkdownCitationsAndCanvasTags(
        result.content,
        result.structuredData?.sources as Source[],
      );

      if (operation === 'createNewNote') {
        // Create new document with content
        editorEmitter.emit('createNewNote', parsedContent);
        message.success(t('knowledgeBase.context.createNoteSuccess'));
        return;
      }

      // Handle insert or replace operations
      if (editor) {
        const selection = editor.view?.state?.selection;

        if (selection) {
          editor
            .chain()
            .focus()
            .insertContentAt(
              {
                from: selection.from,
                to: selection.to,
              },
              parsedContent,
            )
            .run();

          message.success(
            operation === 'insertBlow'
              ? t('knowledgeBase.context.insertSuccess')
              : t('knowledgeBase.context.replaceSuccess'),
          );
        }
      } else {
        message.warning(t('knowledgeBase.context.noEditor'));
      }
    },
    [editor, result, t],
  );
};
