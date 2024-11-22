import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { ActionResult } from '@refly/openapi-schema';

interface ActionResultState {
  resultMap: Record<string, ActionResult>;

  updateActionResult: (resultId: string, result: ActionResult) => void;
}

export const defaultState = {
  resultMap: {},
};

export const useActionResultStore = create<ActionResultState>()(
  immer((set) => ({
    ...defaultState,

    updateActionResult: (resultId: string, result: ActionResult) =>
      set((state) => {
        state.resultMap[resultId] = result;
      }),
  })),
);

export const useActionResultStoreShallow = <T>(selector: (state: ActionResultState) => T) => {
  return useActionResultStore(useShallow(selector));
};
