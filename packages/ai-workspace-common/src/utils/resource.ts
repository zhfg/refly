import { Resource, Source } from '@refly/openapi-schema';

export const mapSourceToResource = (sources: Source[]): Partial<Resource>[] => {
  return sources?.map((item) => ({
    // TODO: future to project will include resourceId and noteId
    resourceId: item?.metadata?.entityId, // may be include resourceId or noteId
    resourceType: item?.metadata?.entityType,
    data: { url: item?.url, title: item?.title } as any,
    title: item?.title,
    content: item?.pageContent,
  }));
};
