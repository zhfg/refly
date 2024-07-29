import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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

interface NoteBaseState {
  currentNote: Note | null;
  currentSelectedText: string;
  isRequesting: boolean;

  // tabs
  tabs: NoteTab[];
  activeTab: string;
  notePanelVisible: boolean;

  // Note
  editor: EditorInstance | null;
  noteServerStatus: NoteServerStatus;
  noteCharsCount: number;
  noteSaveStatus: NoteSaveStatus;

  updateCurrentNote: (note: Note) => void;
  updateIsRequesting: (isRequesting: boolean) => void;
  updateSelectedText: (selectedText: string) => void;
  updateTabs: (tabs: NoteTab[]) => void;
  updateActiveTab: (key: string) => void;
  updateNotePanelVisible: (visible: boolean) => void;
  updateNoteServerStatus: (status: NoteServerStatus) => void;
  updateNoteSaveStatus: (status: NoteSaveStatus) => void;
  updateNoteCharsCount: (count: number) => void;
  updateEditor: (editor: EditorInstance) => void;
}

export const defaultState = {
  currentSelectedText: '',
  currentNote: null as null | Note,
  tabs: [],
  activeTab: 'key1',
  notePanelVisible: true,
  isRequesting: true,

  // notes
  editor: null,
  noteServerStatus: 'disconnected' as NoteServerStatus,
  noteCharsCount: 0,
  noteSaveStatus: 'Unsaved' as NoteSaveStatus,
};

export const useNoteStore = create<NoteBaseState>()(
  devtools((set) => ({
    ...defaultState,

    updateCurrentNote: (note) => set((state) => ({ ...state, currentNote: note })),
    updateIsRequesting: (isRequesting: boolean) => set((state) => ({ ...state, isRequesting })),
    updateSelectedText: (selectedText: string) => set((state) => ({ ...state, currentSelectedText: selectedText })),
    updateTabs: (tabs: NoteTab[]) => set((state) => ({ ...state, tabs })),
    updateActiveTab: (key: string) => set((state) => ({ ...state, activeTab: key })),

    // tabs
    updateNotePanelVisible: (visible: boolean) => set((state) => ({ ...state, notePanelVisible: visible })),

    // notes
    updateEditor: (editor: EditorInstance) => set((state) => ({ ...state, editor })),
    updateNoteServerStatus: (status: NoteServerStatus) => set((state) => ({ ...state, noteServerStatus: status })),
    updateNoteSaveStatus: (status: NoteSaveStatus) => set((state) => ({ ...state, noteSaveStatus: status })),
    updateNoteCharsCount: (count: number) => set((state) => ({ ...state, noteCharsCount: count })),
  })),
);
