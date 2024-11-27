import { Mark } from '@refly/common-types';
import { CanvasNode, CanvasNodeData } from '../components/canvas/nodes';
import { genUniqueId } from '@refly-packages/utils/id';
import { CanvasNodeType } from '@refly/openapi-schema';
import { SelectedTextDomain } from '@refly/common-types';

export const convertMarkToNode = (mark: Mark, nodeType: CanvasNodeType, sourceType: SelectedTextDomain): CanvasNode => {
  return {
    id: genUniqueId(),
    type: nodeType,
    position: { x: 0, y: 0 },
    data: {
      entityId: mark.parentId ?? mark?.entityId ?? '', // document id
      title: mark.title ?? 'Selected Content',
      metadata: {
        contentPreview: mark.data,
        selectedContent: mark.data,
        xPath: mark.xPath,
        projectId: mark.projectId,
        sourceType,
      },
    },
  };
};
