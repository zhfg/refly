export type QueryPayload = {
  page: number;
  pageSize?: number;
  url?: string;
  linkId?: string;
};

export type WebLinkItem = {
  id: string;
  linkId: string;
  title: string;
  description: string;
  originPageTitle?: string;
  originPageUrl?: string;
  origin?: string;
  originPageDescription?: string;
  icon: string;
  url: string;
  userId: string;
  indexStatus: 'processing' | 'finish';
  createdAt: string;
  updatedAt: string;
};

export type HtmlUploadRequest = {
  pageContent: string;
  url: string;
  fileName: string;
};

export type HtmlUploadResult = {
  storageKey: string;
};
