import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { persist } from 'zustand/middleware';
import { Edge } from '@xyflow/react';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

interface CanvasData {
  nodes: CanvasNode<any>[];
  nodesSynced: boolean;
  edges: Edge[];
  edgesSynced: boolean;
  mode: 'pointer' | 'hand';
  pinnedNodes: CanvasNode<any>[];
}

export interface CanvasState {
  data: Record<string, CanvasData>;
  showPreview: boolean;
  showMaxRatio: boolean;
  showLaunchpad: boolean;

  setNodes: (canvasId: string, nodes: CanvasNode<any>[]) => void;
  setNodesSynced: (canvasId: string, synced: boolean) => void;
  setEdges: (canvasId: string, edges: Edge[]) => void;
  setEdgesSynced: (canvasId: string, synced: boolean) => void;
  setMode: (canvasId: string, mode: 'pointer' | 'hand') => void;
  addPinnedNode: (canvasId: string, node: CanvasNode<any>) => void;
  removePinnedNode: (canvasId: string, node: CanvasNode<any>) => void;
  setShowPreview: (show: boolean) => void;
  setShowMaxRatio: (show: boolean) => void;
  setShowLaunchpad: (show: boolean) => void;
}

const defaultCanvasState: () => CanvasData = () => ({
  nodes: [],
  nodesSynced: false,
  edges: [],
  edgesSynced: false,
  selectedNode: null,
  mode: 'hand',
  selectedNodes: [],
  pinnedNodes: [],
});

export const useCanvasStore = create<CanvasState>()(
  persist(
    immer((set) => ({
      data: {},
      showPreview: true,
      showMaxRatio: true,
      showLaunchpad: true,

      setShowPreview: (show) =>
        set((state) => {
          state.showPreview = show;
        }),
      setShowMaxRatio: (show) =>
        set((state) => {
          state.showMaxRatio = show;
        }),
      setShowLaunchpad: (show) =>
        set((state) => {
          state.showLaunchpad = show;
        }),
      setNodes: (canvasId, nodes) =>
        set((state) => {
          state.data[canvasId] ??= defaultCanvasState();
          state.data[canvasId].nodes = nodes;
        }),
      setNodesSynced: (canvasId, synced) =>
        set((state) => {
          state.data[canvasId] ??= defaultCanvasState();
          state.data[canvasId].nodesSynced = synced;
        }),
      setEdges: (canvasId, edges) =>
        set((state) => {
          state.data[canvasId] ??= defaultCanvasState();
          state.data[canvasId].edges = edges;
        }),
      setEdgesSynced: (canvasId, synced) =>
        set((state) => {
          state.data[canvasId] ??= defaultCanvasState();
          state.data[canvasId].edgesSynced = synced;
        }),
      setMode: (canvasId, mode) =>
        set((state) => {
          state.data[canvasId] ??= defaultCanvasState();
          state.data[canvasId].mode = mode;
        }),
      addPinnedNode: (canvasId, node) =>
        set((state) => {
          state.data[canvasId] ??= defaultCanvasState();
          state.data[canvasId].pinnedNodes.unshift(node);
        }),
      removePinnedNode: (canvasId, node) =>
        set((state) => {
          state.data[canvasId] ??= defaultCanvasState();
          state.data[canvasId].pinnedNodes = state.data[canvasId].pinnedNodes.filter((n) => n.id !== node.id);
        }),
    })),
    {
      name: 'canvas-storage',
      partialize: (state) => ({ data: state.data }),
    },
  ),
);

export const useCanvasStoreShallow = <T>(selector: (state: CanvasState) => T) => {
  return useCanvasStore(useShallow(selector));
};
