import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Edge } from '@xyflow/react';
import { CanvasNode } from '@refly-packages/ai-workspace-common/components/canvas/nodes';

interface CanvasData {
  nodes: CanvasNode<any>[];
  edges: Edge[];
  title: string;
  mode: 'pointer' | 'hand';
  pinnedNodes: CanvasNode<any>[];
}

export interface CanvasState {
  data: Record<string, CanvasData>;
  currentCanvasId: string | null;
  showPreview: boolean;
  showMaxRatio: boolean;
  showLaunchpad: boolean;

  setNodes: (canvasId: string, nodes: CanvasNode<any>[]) => void;
  setEdges: (canvasId: string, edges: Edge[]) => void;
  setTitle: (canvasId: string, title: string) => void;
  deleteCanvasData: (canvasId: string) => void;
  setCurrentCanvasId: (canvasId: string) => void;
  setMode: (canvasId: string, mode: 'pointer' | 'hand') => void;
  addPinnedNode: (canvasId: string, node: CanvasNode<any>) => void;
  removePinnedNode: (canvasId: string, node: CanvasNode<any>) => void;
  setShowPreview: (show: boolean) => void;
  setShowMaxRatio: (show: boolean) => void;
  setShowLaunchpad: (show: boolean) => void;
}

const defaultCanvasState: () => CanvasData = () => ({
  nodes: [],
  edges: [],
  title: '',
  mode: 'hand',
  pinnedNodes: [],
});

export const useCanvasStore = create<CanvasState>()((set) => ({
  data: {},
  currentCanvasId: null,
  showPreview: true,
  showMaxRatio: false,
  showLaunchpad: true,

  deleteCanvasData: (canvasId) =>
    set((state) => ({
      data: Object.fromEntries(Object.entries(state.data).filter(([key]) => key !== canvasId)),
    })),

  setCurrentCanvasId: (canvasId) =>
    set(() => ({
      currentCanvasId: canvasId,
    })),

  setShowPreview: (show) =>
    set(() => ({
      showPreview: show,
    })),

  setShowMaxRatio: (show) =>
    set(() => ({
      showMaxRatio: show,
    })),

  setShowLaunchpad: (show) =>
    set(() => ({
      showLaunchpad: show,
    })),

  setNodes: (canvasId, nodes) =>
    set((state) => ({
      data: {
        ...state.data,
        [canvasId]: {
          ...(state.data[canvasId] ?? defaultCanvasState()),
          nodes,
        },
      },
    })),

  setEdges: (canvasId, edges) =>
    set((state) => ({
      data: {
        ...state.data,
        [canvasId]: {
          ...(state.data[canvasId] ?? defaultCanvasState()),
          edges,
        },
      },
    })),

  setTitle: (canvasId, title) =>
    set((state) => ({
      data: {
        ...state.data,
        [canvasId]: {
          ...(state.data[canvasId] ?? defaultCanvasState()),
          title,
        },
      },
    })),

  setMode: (canvasId, mode) =>
    set((state) => ({
      data: {
        ...state.data,
        [canvasId]: {
          ...(state.data[canvasId] ?? defaultCanvasState()),
          mode,
        },
      },
    })),

  addPinnedNode: (canvasId, node) =>
    set((state) => {
      const currentData = state.data[canvasId] ?? defaultCanvasState();
      return {
        data: {
          ...state.data,
          [canvasId]: {
            ...currentData,
            pinnedNodes: [node, ...currentData.pinnedNodes],
          },
        },
      };
    }),

  removePinnedNode: (canvasId, node) =>
    set((state) => {
      const currentData = state.data[canvasId] ?? defaultCanvasState();
      return {
        data: {
          ...state.data,
          [canvasId]: {
            ...currentData,
            pinnedNodes: currentData.pinnedNodes.filter((n) => n.id !== node.id),
          },
        },
      };
    }),
}));

export const useCanvasStoreShallow = <T>(selector: (state: CanvasState) => T) => {
  return useCanvasStore(useShallow(selector));
};
