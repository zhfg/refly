export interface SelectionEdit {
  type: 'selection';
  range: {
    from: number; // tiptap position
    to: number; // tiptap position
  };
  content: string; // 选中的内容
  action: 'update' | 'replace' | 'enhance' | 'simplify';
}

export interface SemanticEdit {
  type: 'semantic';
  target: {
    type: 'heading' | 'paragraph' | 'list' | 'codeBlock';
    identifier: string; // 可能是标题文本或其他标识符
  };
  action: 'update' | 'expand' | 'summarize' | 'restructure';
}

export interface PositionalEdit {
  type: 'positional';
  location: 'before' | 'after' | 'beginning' | 'end';
  reference: {
    type: 'heading' | 'paragraph' | 'section';
    content: string;
  };
  action: 'insert' | 'append';
}

export interface SelectedRange {
  startIndex: number;
  endIndex: number;
}

export interface EditSection {
  startIndex: number;
  endIndex: number;
  originalContent: string;
  updatedContent: string;
}

export interface EditResult {
  sections: EditSection[];
  summary: string;
}
