export type QueryPayload = {
  page: number;
  pageSize?: number;
  url?: string;
  linkId?: string;
};

export type HtmlUploadRequest = {
  pageContent: string;
  url: string;
  fileName: string;
};

export type HtmlUploadResult = {
  storageKey: string;
};
