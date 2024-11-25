import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { Edge } from '@xyflow/react';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

interface CanvasData {
  nodes: CanvasNode<any>[];
  edges: Edge[];
  selectedNode: CanvasNode<any> | null;
  mode: 'pointer' | 'hand';
  selectedNodes: CanvasNode<any>[];
}

export interface CanvasState {
  data: Record<string, CanvasData>;

  setNodes: (canvasId: string, nodes: CanvasNode<any>[]) => void;
  setEdges: (canvasId: string, edges: Edge[]) => void;
  setSelectedNode: (canvasId: string, node: CanvasNode<any> | null) => void;
  setMode: (canvasId: string, mode: 'pointer' | 'hand') => void;
  setSelectedNodes: (canvasId: string, nodes: CanvasNode<any>[]) => void;
}

export const useCanvasStore = create<CanvasState>()(
  immer((set) => ({
    data: {},
    setNodes: (canvasId, nodes) =>
      set((state) => {
        state.data[canvasId] ??= { nodes: [], edges: [], selectedNode: null, mode: 'hand', selectedNodes: [] };
        state.data[canvasId].nodes = nodes;
      }),
    setEdges: (canvasId, edges) =>
      set((state) => {
        state.data[canvasId] ??= { nodes: [], edges: [], selectedNode: null, mode: 'hand', selectedNodes: [] };
        state.data[canvasId].edges = edges;
      }),
    setSelectedNode: (canvasId, node) =>
      set((state) => {
        state.data[canvasId] ??= { nodes: [], edges: [], selectedNode: null, mode: 'hand', selectedNodes: [] };
        state.data[canvasId].selectedNode = node;
      }),
    setMode: (canvasId, mode) =>
      set((state) => {
        state.data[canvasId] ??= { nodes: [], edges: [], selectedNode: null, mode: 'hand', selectedNodes: [] };
        state.data[canvasId].mode = mode;
      }),
    setSelectedNodes: (canvasId, nodes) =>
      set((state) => {
        state.data[canvasId] ??= { nodes: [], edges: [], selectedNode: null, mode: 'hand', selectedNodes: [] };
        state.data[canvasId].selectedNodes = nodes;
      }),
  })),
);

export const useCanvasStoreShallow = <T>(selector: (state: CanvasState) => T) => {
  return useCanvasStore(useShallow(selector));
};
