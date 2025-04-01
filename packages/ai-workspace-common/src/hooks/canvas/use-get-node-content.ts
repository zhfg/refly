import { Node } from '@xyflow/react';
import {
  useGetResourceDetail,
  useGetDocumentDetail,
  useGetActionResult,
} from '@refly-packages/ai-workspace-common/queries';

export const useGetNodeContent = (node: Node) => {
  const id = node?.data?.entityId as string;
  const type = node?.type;

  const { data: document } = useGetDocumentDetail({ query: { docId: id } }, null, {
    enabled: type === 'document' && !!id,
  });

  const { data: resource } = useGetResourceDetail({ query: { resourceId: id } }, null, {
    enabled: type === 'resource' && !!id,
  });

  const { data: actionResult } = useGetActionResult({ query: { resultId: id } }, null, {
    enabled: type === 'skillResponse' && !!id,
  });

  const getNodeContent = () => {
    switch (node.type) {
      case 'document':
        return document?.data?.content || node?.data?.contentPreview;
      case 'resource':
        return resource?.data?.content || node?.data?.contentPreview;
      case 'skillResponse':
        return (
          actionResult?.data?.steps
            ?.map((step) => step?.content || '')
            .filter(Boolean)
            .join('\n\n') || node?.data?.contentPreview
        );
      default:
        return node?.data?.contentPreview;
    }
  };
  return {
    getNodeContent,
  };
};
