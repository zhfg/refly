import { Resource, Source } from '@refly/openapi-schema';

export const mapSourceToResource = (sources: Source[]): Partial<Resource>[] => {
  return sources?.map((item) => ({
    collectionId: item?.metadata?.collectionId,
    resourceId: item?.metadata?.resourceId,
    data: { url: item?.url, title: item?.title } as any,
    title: item?.title,
    content: item?.pageContent,
  }));
};
