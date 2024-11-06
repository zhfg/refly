import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Canvas } from '@refly/openapi-schema';
import { Mark } from '@refly/common-types';

interface ShareState {
  // 基础数据
  canvasList: Canvas[];
  currentCanvasId: string | null;

  // 转换后的上下文数据
  availableMarks: Mark[]; // 可选的上下文列表

  // actions
  setCanvasList: (canvasList: Canvas[]) => void;
  setCurrentCanvasId: (id: string | null) => void;
  updateAvailableMarks: (marks: Mark[]) => void;
}

const defaultState = {
  canvasList: [],
  currentCanvasId: null,
  availableMarks: [],
};

export const useShareStore = create<ShareState>()(
  devtools((set) => ({
    ...defaultState,

    setCanvasList: (canvasList) => {
      set((state) => {
        // 当 canvasList 更新时，同时更新 availableMarks
        const marks: Mark[] = canvasList.map((canvas) => ({
          id: canvas.canvasId,
          type: 'canvas',
          title: canvas.title,
          data: canvas.content,
          entityId: canvas.canvasId,
        }));

        return {
          ...state,
          canvasList,
          availableMarks: marks,
        };
      });
    },

    setCurrentCanvasId: (id) =>
      set((state) => ({
        ...state,
        currentCanvasId: id,
      })),

    updateAvailableMarks: (marks) =>
      set((state) => ({
        ...state,
        availableMarks: marks,
      })),
  })),
);

export const useShareStoreShallow = <T>(selector: (state: ShareState) => T) => {
  return useShareStore(useShallow(selector));
};
