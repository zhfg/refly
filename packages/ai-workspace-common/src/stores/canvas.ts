import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { Edge } from '@xyflow/react';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

interface CanvasData {
  nodes: CanvasNode<any>[];
  edges: Edge[];
  mode: 'pointer' | 'hand';
  pinnedNodes: CanvasNode<any>[];
}

export interface CanvasState {
  data: Record<string, CanvasData>;
  showPreview: boolean;

  setNodes: (canvasId: string, nodes: CanvasNode<any>[]) => void;
  setEdges: (canvasId: string, edges: Edge[]) => void;
  setMode: (canvasId: string, mode: 'pointer' | 'hand') => void;
  addPinnedNode: (canvasId: string, node: CanvasNode<any>) => void;
  removePinnedNode: (canvasId: string, node: CanvasNode<any>) => void;
  setShowPreview: (show: boolean) => void;
}

const defaultState: () => CanvasData = () => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  mode: 'hand',
  selectedNodes: [],
  pinnedNodes: [],
});

export const useCanvasStore = create<CanvasState>()(
  immer((set) => ({
    data: {},
    showPreview: true,

    setShowPreview: (show) =>
      set((state) => {
        state.showPreview = show;
      }),
    setNodes: (canvasId, nodes) =>
      set((state) => {
        state.data[canvasId] ??= defaultState();
        state.data[canvasId].nodes = nodes;
      }),
    setEdges: (canvasId, edges) =>
      set((state) => {
        state.data[canvasId] ??= defaultState();
        state.data[canvasId].edges = edges;
      }),
    setMode: (canvasId, mode) =>
      set((state) => {
        state.data[canvasId] ??= defaultState();
        state.data[canvasId].mode = mode;
      }),
    addPinnedNode: (canvasId, node) =>
      set((state) => {
        state.data[canvasId] ??= defaultState();
        state.data[canvasId].pinnedNodes.unshift(node);
      }),
    removePinnedNode: (canvasId, node) =>
      set((state) => {
        state.data[canvasId] ??= defaultState();
        state.data[canvasId].pinnedNodes = state.data[canvasId].pinnedNodes.filter((n) => n.id !== node.id);
      }),
  })),
);

export const useCanvasStoreShallow = <T>(selector: (state: CanvasState) => T) => {
  return useCanvasStore(useShallow(selector));
};
