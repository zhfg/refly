import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { Collection, Conversation, Resource, SearchResult, SkillMeta } from '@refly/openapi-schema';

export interface SearchState {
  // state
  isSearchOpen: boolean;

  // 所有列表资源
  notes: Resource[];
  readResources: Resource[];
  knowledgeBases: Collection[];
  convs: Conversation[];
  skills: SkillMeta[];

  // 大搜菜单页
  pages: string[];

  // 所有可搜索的资源
  searchedNotes: SearchResult[];
  searchedReadResources: SearchResult[];
  searchedKnowledgeBases: SearchResult[];
  searchedConvs: SearchResult[];
  searchedSkills: SearchResult[];

  // method
  setIsSearchOpen: (isSearchOpen: boolean) => void;
  setNotes: (notes: Resource[]) => void;
  setReadResources: (readResources: Resource[]) => void;
  setKnowledgeBases: (knowledgeBases: Collection[]) => void;
  setConvs: (convs: Conversation[]) => void;
  setSkills: (skills: SkillMeta[]) => void;
  setSearchedRes: ({
    notes,
    readResources,
    knowledgeBases,
    convs,
    skills,
  }: {
    notes: SearchResult[];
    readResources: SearchResult[];
    knowledgeBases: SearchResult[];
    convs: SearchResult[];
    skills: SearchResult[];
  }) => void;
  setPages: (pages: string[]) => void;
  resetState: () => void;
}

export const defaultState = {
  isSearchOpen: false,
  notes: [],
  pages: ['home'],
  readResources: [],
  knowledgeBases: [],
  convs: [],
  skills: [],
  searchedNotes: [],
  searchedReadResources: [],
  searchedKnowledgeBases: [],
  searchedConvs: [],
  searchedSkills: [],
};

export const useSearchStore = create<SearchState>()(
  devtools((set) => ({
    ...defaultState,

    setIsSearchOpen: (isSearchOpen: boolean) => set((state) => ({ ...state, isSearchOpen })),
    setNotes: (notes: Resource[]) => set((state) => ({ ...state, notes })),
    setReadResources: (readResources: Resource[]) => set((state) => ({ ...state, readResources })),
    setKnowledgeBases: (knowledgeBases: Collection[]) => set((state) => ({ ...state, knowledgeBases })),
    setConvs: (convs: Conversation[]) => set((state) => ({ ...state, convs })),
    setSkills: (skills: SkillMeta[]) => set((state) => ({ ...state, skills })),
    setSearchedRes: (data) =>
      set((state) => ({
        ...state,
        searchedConvs: data?.convs,
        searchedNotes: data?.notes,
        searchedReadResources: data?.readResources,
        searchedKnowledgeBases: data?.knowledgeBases,
        searchedSkills: data?.skills,
      })),
    setPages: (pages: string[]) => set((state) => ({ ...state, pages })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
