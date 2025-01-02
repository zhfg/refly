import { memo } from 'react';
import {
  DocumentNodeProps,
  MemoNodeProps,
  ResourceNodeProps,
  SkillResponseNode,
  SkillResponseNodeProps,
} from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { DocumentNode, ResourceNode, MemoNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';
import { useCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-canvas-data';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';

export const ContextPreview = memo(
  ({ item }: { item: IContextItem }) => {
    const { nodes } = useCanvasData();
    const node = nodes.find((node) => node.data?.entityId === item?.entityId);

    const commonProps = {
      isPreview: true,
      hideActions: true,
      hideHandles: true,
      data: node?.data,
      selected: false,
      id: node?.id,
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
    return prevProps.item.entityId === nextProps.item.entityId;
  },
);
