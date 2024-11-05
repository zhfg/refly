import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

export type DataFetcher = (queryPayload: {
  page: number;
  pageSize: number;
}) => Promise<{ success: boolean; data?: SearchResult[] }>;

export const domainToFetchData: Record<SearchDomain, DataFetcher> = {
  project: async (queryPayload) => {
    const res = await getClient().listProjects({
      query: queryPayload,
    });
    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.projectId,
      title: item?.title,
      domain: 'project',
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
  canvas: async (queryPayload) => {
    const res = await getClient().listCanvas({
      query: queryPayload,
    });
    const data: SearchResult[] = (res?.data?.data || []).map((item) => ({
      id: item?.canvasId,
      title: item?.title,
      domain: 'canvas',
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
