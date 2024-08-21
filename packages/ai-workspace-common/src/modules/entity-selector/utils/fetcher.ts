import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export type DataFetcher = (queryPayload: {
  page: number;
  pageSize: number;
}) => Promise<{ success: boolean; data?: SearchResult[] }>;

export const domainToFetchData: Record<SearchDomain, DataFetcher> = {
  collection: async (queryPayload) => {
    const res = await getClient().listCollections({
      query: queryPayload,
    });
    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.collectionId,
      title: item?.title,
      domain: 'collection',
    }));
    return { success: res?.data?.success, data };
  },
  resource: async (queryPayload) => {
    const res = await getClient().listResources({
      query: queryPayload,
    });
    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.resourceId,
      title: item?.title,
      domain: 'resource',
    }));
    return { success: res?.data?.success, data };
  },
  note: async (queryPayload) => {
    const res = await getClient().listNotes({
      query: queryPayload,
    });
    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.noteId,
      title: item?.title,
      domain: 'note',
    }));
    return { success: res?.data?.success, data };
  },
  conversation: async (queryPayload) => {
    const res = await getClient().listConversations({
      query: queryPayload,
    });
    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.convId,
      title: item?.title,
      domain: 'conversation',
    }));
    return { success: res?.data?.success, data };
  },
  skill: async (queryPayload) => {
    const res = await getClient().listSkillInstances({
      query: queryPayload,
    });
    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.skillId,
      title: item?.displayName,
      domain: 'skill',
    }));
    return { success: res?.data?.success, data };
  },
};
