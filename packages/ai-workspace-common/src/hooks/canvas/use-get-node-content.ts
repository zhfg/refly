import { Node } from '@xyflow/react';
import {
  useGetResourceDetail,
  useGetDocumentDetail,
} from '@refly-packages/ai-workspace-common/queries';

export const useGetNodeContent = (node: Node) => {
  console.log('type', node);
  const id = node?.data?.entityId as string;
  const type = node?.type;

  const { data: document } = useGetDocumentDetail({ query: { docId: id } }, null, {
    enabled: type === 'document' && !!id,
  });

  const { data: resource } = useGetResourceDetail({ query: { resourceId: id } }, null, {
    enabled: type === 'resource' && !!id,
  });

  const getNodeContent = () => {
    switch (node.type) {
      case 'document':
        return document?.data?.content;
      case 'resource':
        return resource?.data?.content;
      default:
        return '';
    }
  };
  return {
    getNodeContent,
  };
};
