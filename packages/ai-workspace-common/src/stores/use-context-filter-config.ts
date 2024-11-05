import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { FilterConfig } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/hooks/use-process-context-filter';

interface ContextFilterConfigState {
  config: FilterConfig;
  useConfigOfStore: boolean;

  setConfig: (newState: FilterConfig) => void;
  setUseConfigOfStore: (newState: boolean) => void;
}

export const defaultState = {
  // skills
  config: {
    type: [],
  },
  useConfigOfStore: false,
};

export const useContextFilterConfigStore = create<ContextFilterConfigState>()(
  devtools((set) => ({
    ...defaultState,

    setConfig: (newState: FilterConfig) => set((state) => ({ ...state, config: newState })),
    setUseConfigOfStore: (newState: boolean) => set((state) => ({ ...state, useConfigOfStore: newState })),
  })),
);

export const useContextFilterConfigStoreShallow = <T>(selector: (state: ContextFilterConfigState) => T) => {
  return useContextFilterConfigStore(useShallow(selector));
};
