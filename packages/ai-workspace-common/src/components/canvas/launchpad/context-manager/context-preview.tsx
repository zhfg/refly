import { memo } from 'react';
import {
  CanvasNode,
  DocumentNodeProps,
  MemoNodeProps,
  ResourceNodeProps,
  SkillResponseNode,
  SkillResponseNodeProps,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { DocumentNode, ResourceNode, MemoNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-data';

export const ContextPreview = memo(
  ({ item }: { item: CanvasNode }) => {
    const { nodes } = useCanvasData();
    const node = nodes.find((node) => node.data?.entityId === item?.data?.entityId);

    const commonProps = {
      isPreview: true,
      hideActions: true,
      hideHandles: true,
      data: node?.data,
      selected: false,
      id: item?.id,
    };

    switch (item?.type) {
      case 'document':
        return <DocumentNode {...(commonProps as DocumentNodeProps)} />;
      case 'resource':
        return <ResourceNode {...(commonProps as ResourceNodeProps)} />;
      case 'skillResponse':
        return <SkillResponseNode {...(commonProps as SkillResponseNodeProps)} />;
      case 'memo':
        return <MemoNode {...(commonProps as MemoNodeProps)} />;
      default:
        return null;
    }
  },
  (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id && prevProps.item.type === nextProps.item.type;
  },
);
