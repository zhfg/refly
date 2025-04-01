export interface NodeData {
  id: string;
  label: string;
  children?: NodeData[];
  [key: string]: any; // Allow additional properties
}
