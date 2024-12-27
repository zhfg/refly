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
  const { nodes, edges, canvasId } = useCanvasData(selectedCanvasId);
  const { setNodes } = useCanvasStoreShallow((state) => ({
    setNodes: state.setNodes,
  }));

  const { onLayout } = useCanvasLayout(selectedCanvasId);
  const {
    setSelectedNode,
    setSelectedNodeByEntity,
    deselectNode,
    deselectNodeByEntity,
    setSelectedNodes,
    addSelectedNode,
    addSelectedNodeByEntity,
  } = useNodeSelection(selectedCanvasId);
  const { setNodeCenter } = useNodePosition();
  const { onEdgesChange, onConnect, updateAllEdgesStyle } = useEdgeOperations(selectedCanvasId);
  const { onNodesChange } = useNodeOperations(selectedCanvasId);
  const { addNode } = useAddNode(canvasId);
  const { syncTitleToYDoc } = useCanvasSync();
  const setNodeDataByEntity = useSetNodeDataByEntity();

  return {
    nodes,
    edges,
    setSelectedNode,
    setSelectedNodeByEntity,
    deselectNode,
    deselectNodeByEntity,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onLayout,
    addNode,
    setNodeCenter,
    setSelectedNodes,
    addSelectedNode,
    addSelectedNodeByEntity,
    updateAllEdgesStyle,
    setCanvasTitle: syncTitleToYDoc,
    setNodeDataByEntity,
  };
};
