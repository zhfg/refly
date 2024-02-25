export type QueryPayload = {
    page: number;
    pageSize?: number;
    url?: string;
    linkId?: string;
}

export type WebLinkItem = {
    id: string;
    linkId: string;
    title: string;
    description: string;
    icon: string;
    url: string;
    userId: string;
    indexStatus: "processing" | 'finish',
    createdAt: string;
    updatedAt: string;
}