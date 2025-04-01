export interface NodeData {
  id: string;
  label: string;
  children?: NodeData[];
  [key: string]: any;
}

export interface ExtractedContent {
  title: string;
  keyPoints: {
    point: string;
    context?: string;
  }[];
}
