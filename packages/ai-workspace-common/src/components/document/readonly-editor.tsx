import { useEffect, useMemo, useRef, memo } from 'react';
import classNames from 'classnames';
import { Markdown } from 'tiptap-markdown';
import {
  EditorRoot,
  EditorContent,
  EditorInstance,
} from '@refly-packages/ai-workspace-common/components/editor/core/components';

import { handleCommandNavigation } from '@refly-packages/ai-workspace-common/components/editor/core/extensions';
import { defaultExtensions } from '@refly-packages/ai-workspace-common/components/editor/components/extensions';
import { getHierarchicalIndexes, TableOfContents } from '@tiptap-pro/extension-table-of-contents';
import { useDocumentStoreShallow } from '@refly-packages/ai-workspace-common/stores/document';

export const ReadonlyEditor = memo(
  ({ docId }: { docId: string }) => {
    const editorRef = useRef<EditorInstance>();
    const document = useDocumentStoreShallow((state) => state.data[docId]?.document);

    useEffect(() => {
      return () => {
        if (editorRef.current) {
          editorRef?.current?.destroy?.();
        }
      };
    }, [docId]);

    const extensions = useMemo(
      () => [
        ...defaultExtensions,
        Markdown,
        TableOfContents.configure({ getIndex: getHierarchicalIndexes }),
      ],
      [docId],
    );

    useEffect(() => {
      if (document?.content && editorRef.current) {
        editorRef.current?.commands.setContent(document.content);
      }
    }, [document?.content]);

    return (
      <div className={classNames('w-full', 'ai-note-editor-content-container')}>
        <div className="w-full h-full">
          <EditorRoot>
            <EditorContent
              extensions={extensions}
              onCreate={({ editor }) => {
                editorRef.current = editor;
              }}
              editable={false}
              className="w-full h-full border-muted sm:rounded-lg"
              editorProps={{
                handleDOMEvents: {
                  keydown: (_view, event) => handleCommandNavigation(event),
                },
                attributes: {
                  class:
                    'prose prose-md prose-headings:font-title font-default focus:outline-none max-w-full',
                  'data-doc-id': docId,
                },
              }}
            />
          </EditorRoot>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.docId === nextProps.docId,
);
