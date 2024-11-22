import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { Edge } from '@xyflow/react';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

interface CanvasData {
  nodes: CanvasNode[];
  edges: Edge[];
  selectedNode: CanvasNode | null;
}

export interface CanvasState {
  data: Record<string, CanvasData>;

  setNodes: (canvasId: string, nodes: CanvasNode[]) => void;
  setEdges: (canvasId: string, edges: Edge[]) => void;
  setSelectedNode: (canvasId: string, node: CanvasNode | null) => void;
}

export const useCanvasStore = create<CanvasState>()(
  immer((set) => ({
    data: {},
    setNodes: (canvasId, nodes) =>
      set((state) => {
        state.data[canvasId] ??= { nodes: [], edges: [], selectedNode: null };
        state.data[canvasId].nodes = nodes;
      }),
    setEdges: (canvasId, edges) =>
      set((state) => {
        state.data[canvasId] ??= { nodes: [], edges: [], selectedNode: null };
        state.data[canvasId].edges = edges;
      }),
    setSelectedNode: (canvasId, node) =>
      set((state) => {
        state.data[canvasId] ??= { nodes: [], edges: [], selectedNode: null };
        state.data[canvasId].selectedNode = node;
      }),
  })),
);

export const useCanvasStoreShallow = <T>(selector: (state: CanvasState) => T) => {
  return useCanvasStore(useShallow(selector));
};
