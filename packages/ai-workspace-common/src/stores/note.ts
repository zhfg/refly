import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { Note } from '@refly/openapi-schema';
import { EditorInstance } from '@refly-packages/editor-core/components';

export enum ActionSource {
  KnowledgeBase = 'knowledge-base',
  Conv = 'conv',
  Note = 'note',
}

export interface NoteTab {
  title: string;
  key: string;
  content: string;
  noteId: string;
}

export type NoteServerStatus = 'disconnected' | 'connected';
export type NoteSaveStatus = 'Saved' | 'Unsaved';

export interface TableOfContentsItem {
  isActive: boolean;
  isScrolledOver: boolean;
  id: string;
  itemIndex: number;
  textContent: string;
}

interface NoteBaseState {
  currentNote: Note | null;
  isRequesting: boolean;
  newNoteCreating: boolean;

  // tabs
  tabs: NoteTab[];
  activeTab: string;
  notePanelVisible: boolean;

  // Note
  editor: EditorInstance | null;
  noteServerStatus: NoteServerStatus;
  noteCharsCount: number;
  noteSaveStatus: NoteSaveStatus;

  lastCursorPosRef: number | null;

  // tocItems
  tocItems: TableOfContentsItem[];

  updateCurrentNote: (note: Note) => void;
  updateIsRequesting: (isRequesting: boolean) => void;
  updateNewNoteCreating: (creating: boolean) => void;
  updateTabs: (tabs: NoteTab[]) => void;
  updateActiveTab: (key: string) => void;
  updateNotePanelVisible: (visible: boolean) => void;
  updateNoteServerStatus: (status: NoteServerStatus) => void;
  updateNoteSaveStatus: (status: NoteSaveStatus) => void;
  updateNoteCharsCount: (count: number) => void;
  updateEditor: (editor: EditorInstance) => void;

  updateLastCursorPosRef: (pos: number) => void;
  updateTocItems: (items: TableOfContentsItem[]) => void;

  resetState: () => void;
}

export const defaultState = {
  currentNote: null as null | Note,
  tabs: [],
  activeTab: 'key1',
  notePanelVisible: false,
  isRequesting: false,
  newNoteCreating: false,
  tocItems: [],

  // notes
  editor: null,
  noteServerStatus: 'disconnected' as NoteServerStatus,
  noteCharsCount: 0,
  noteSaveStatus: 'Unsaved' as NoteSaveStatus,

  // note selection status content, main for skill consume
  lastCursorPosRef: null,
};

export const useNoteStore = create<NoteBaseState>()(
  devtools((set) => ({
    ...defaultState,

    updateCurrentNote: (note) => set((state) => ({ ...state, currentNote: note })),
    updateIsRequesting: (isRequesting: boolean) => set((state) => ({ ...state, isRequesting })),
    updateTabs: (tabs: NoteTab[]) => set((state) => ({ ...state, tabs })),
    updateActiveTab: (key: string) => set((state) => ({ ...state, activeTab: key })),
    updateNewNoteCreating: (creating: boolean) => set((state) => ({ ...state, newNoteCreating: creating })),

    // tabs
    updateNotePanelVisible: (visible: boolean) => set((state) => ({ ...state, notePanelVisible: visible })),

    // notes
    updateEditor: (editor: EditorInstance) => set((state) => ({ ...state, editor })),
    updateNoteServerStatus: (status: NoteServerStatus) => set((state) => ({ ...state, noteServerStatus: status })),
    updateNoteSaveStatus: (status: NoteSaveStatus) => set((state) => ({ ...state, noteSaveStatus: status })),
    updateNoteCharsCount: (count: number) => set((state) => ({ ...state, noteCharsCount: count })),
    updateLastCursorPosRef: (pos: number) => set((state) => ({ ...state, lastCursorPosRef: pos })),
    updateTocItems: (items: TableOfContentsItem[]) => set((state) => ({ ...state, tocItems: items })),

    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useNoteStoreShallow = <T>(selector: (state: NoteBaseState) => T) => {
  return useNoteStore(useShallow(selector));
};
