import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { useDocumentStore, useDocumentStoreShallow } from '../stores/document';
import { useActionResultStore, useActionResultStoreShallow } from '../stores/action-result';
import { parseMarkdownCitationsAndCanvasTags, safeParseJSON } from '@refly/utils/parse';
import { EditorOperation, editorEmitter } from '@refly-packages/utils/event-emitter/editor';
import { Source } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export const useInsertToDocument = (resultId: string) => {
  const { t } = useTranslation();

  const fetchActionResult = async (resultId: string) => {
    const { data, error } = await getClient().getActionResult({
      query: { resultId },
    });

    if (error || !data?.success) {
      return;
    }

    return data.data;
  };

  return useCallback(
    async (operation: EditorOperation = 'insertBlow') => {
      const { activeDocumentId, documentStates } = useDocumentStore.getState();
      const { resultMap } = useActionResultStore.getState();
      const result = resultMap?.[resultId] || (await fetchActionResult(resultId));

      if (!activeDocumentId) {
        message.warning(t('knowledgeBase.context.noActiveDocument'));
        return;
      }

      const editor = documentStates[activeDocumentId]?.editor;
      if (!editor) {
        message.warning(t('knowledgeBase.context.noEditor'));
        return;
      }

      const answerQuestionStep = result?.steps?.find((step) => step?.name === 'answerQuestion');
      if (!answerQuestionStep?.content) {
        message.warning(t('knowledgeBase.context.noContent'));
        return;
      }

      // Parse content with citations
      const sources =
        typeof answerQuestionStep?.structuredData?.['sources'] === 'string'
          ? safeParseJSON(answerQuestionStep?.structuredData?.['sources'])
          : (answerQuestionStep?.structuredData?.['sources'] as Source[]);
      const parsedContent = parseMarkdownCitationsAndCanvasTags(answerQuestionStep?.content || '', sources);

      // Handle insert or replace operations
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
    },
    [t],
  );
};
