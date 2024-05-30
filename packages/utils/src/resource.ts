import { ResourceDetail, Source } from './types';

export const mapSourceToResource = (sources: Source[]): Partial<ResourceDetail>[] => {
  return sources?.map((item) => ({
    collectionId: item?.metadata?.collectionId,
    resourceId: item?.metadata?.resourceId,
    data: { url: item?.metadata?.source, title: item?.metadata?.title } as any,
    title: item?.metadata?.title,
    description: item?.pageContent,
  }));
};
