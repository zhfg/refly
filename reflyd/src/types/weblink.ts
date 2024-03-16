export interface Source {
  pageContent: string;
  metadata: {
    source: string;
    title: string;
  };
  score: number;
}
