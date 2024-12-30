import { useCanvasData } from './use-canvas-data';
import { useCanvasStoreShallow } from '../../stores/canvas';
import { useCanvasLayout } from './use-canvas-layout';
import { useNodeSelection } from './use-node-selection';
import { useNodePosition } from './use-node-position';
import { useEdgeOperations } from './use-edge-operations';
import { useNodeOperations } from './use-node-operations';
import { useAddNode } from './use-add-node';
import { useCanvasSync } from './use-canvas-sync';
import { useSetNodeDataByEntity } from './use-set-node-data-by-entity';

export const useCanvasControl = (selectedCanvasId?: string) => {
  return {};
};
