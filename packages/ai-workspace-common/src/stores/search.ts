import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { Project, Conversation, Resource, SearchResult, SkillMeta } from '@refly/openapi-schema';
import { Mark } from '@refly/common-types';

type SearchPage = 'notes' | 'readResources' | 'knowledgeBases' | 'convs' | 'skills';

export interface SearchState {
  // state
  isSearchOpen: boolean;

  // 所有列表资源
  canvases: Resource[];
  readResources: Resource[];
  projects: Project[];
  convs: Conversation[];
  skills: SkillMeta[];

  // no category  big search res
  noCategoryBigSearchRes: Mark[];

  // 大搜菜单页
  pages: string[];

  // 所有可搜索的资源
  searchedCanvases: SearchResult[];
  searchedReadResources: SearchResult[];
  searchedProjects: SearchResult[];
  searchedConvs: SearchResult[];
  searchedSkills: SearchResult[];

  // method
  setIsSearchOpen: (isSearchOpen: boolean) => void;
  setNotes: (notes: Resource[]) => void;
  setReadResources: (readResources: Resource[]) => void;
  setProjects: (knowledgeBases: Project[]) => void;
  setConvs: (convs: Conversation[]) => void;
  setSkills: (skills: SkillMeta[]) => void;
  setSearchedRes: ({
    canvases,
    readResources,
    projects,
    convs,
    skills,
  }: {
    canvases: SearchResult[];
    readResources: SearchResult[];
    projects: SearchResult[];
    convs: SearchResult[];
    skills: SearchResult[];
  }) => void;
  setNoCategoryBigSearchRes: (noCategoryBigSearchRes: Mark[]) => void;
  setPages: (pages: string[]) => void;
  resetState: () => void;
}

export const defaultState = {
  isSearchOpen: false,
  canvases: [],
  pages: ['home'],
  readResources: [],
  projects: [],
  convs: [],
  skills: [],

  noCategoryBigSearchRes: [],

  searchedCanvases: [],
  searchedReadResources: [],
  searchedProjects: [],
  searchedConvs: [],
  searchedSkills: [],
};

export const useSearchStore = create<SearchState>()(
  devtools((set) => ({
    ...defaultState,

    setIsSearchOpen: (isSearchOpen: boolean) => set((state) => ({ ...state, isSearchOpen })),
    setNotes: (notes: Resource[]) => set((state) => ({ ...state, canvases: notes })),
    setReadResources: (readResources: Resource[]) => set((state) => ({ ...state, readResources })),
    setProjects: (knowledgeBases: Project[]) => set((state) => ({ ...state, knowledgeBases })),
    setConvs: (convs: Conversation[]) => set((state) => ({ ...state, convs })),
    setSkills: (skills: SkillMeta[]) => set((state) => ({ ...state, skills })),
    setSearchedRes: (data) =>
      set((state) => ({
        ...state,
        searchedConvs: data?.convs,
        searchedCanvases: data?.canvases,
        searchedReadResources: data?.readResources,
        searchedProjects: data?.projects,
        searchedSkills: data?.skills,
      })),
    setNoCategoryBigSearchRes: (noCategoryBigSearchRes: Mark[]) =>
      set((state) => ({ ...state, noCategoryBigSearchRes })),
    setPages: (pages: SearchPage[]) => set((state) => ({ ...state, pages })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useSearchStoreShallow = <T>(selector: (state: SearchState) => T) => {
  return useSearchStore(useShallow(selector));
};
