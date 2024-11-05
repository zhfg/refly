import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { Project, Conversation } from '@refly/openapi-schema';
export interface RecentsState {
  // state
  recentProjects: Project[];
  recentConversations: Conversation[];

  // method
  setRecentProjects: (val: Project[]) => void;
  setRecentConversations: (val: Conversation[]) => void;
}

const defaultState: RecentsState = {
  recentProjects: [],
  recentConversations: [],

  setRecentProjects: () => {},
  setRecentConversations: () => {},
};

export const useRecentsStore = create<RecentsState>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,

        setRecentProjects: (val: Project[]) => set((state) => ({ ...state, recentProjects: val })),
        setRecentConversations: (val: Conversation[]) => set((state) => ({ ...state, recentConversations: val })),
      }),
      {
        name: 'recents',
        partialize: (state) => ({
          recentProjects: state.recentProjects,
          recentConversations: state.recentConversations,
        }),
      },
    ),
  ),
);

export const useRecentsStoreShallow = <T>(selector: (state: RecentsState) => T) => {
  return useRecentsStore(useShallow(selector));
};
