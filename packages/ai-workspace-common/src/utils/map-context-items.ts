import { SkillContextDocumentItem } from '@refly-packages/ai-workspace-common/requests/types.gen';

import { SkillContextResourceItem } from '@refly-packages/ai-workspace-common/requests/types.gen';

import { SkillContextContentItem } from '@refly-packages/ai-workspace-common/requests/types.gen';
import { IContextItem } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { genUniqueId } from '@refly-packages/utils/id';

const convertContextToItems = (context?: any): IContextItem[] => {
  if (!context) return [];

  const items: IContextItem[] = [];

  // Convert contentList
  context.contentList?.forEach((content: SkillContextContentItem) => {
    const metadata = content.metadata as any;
    items.push({
      id: metadata?.nodeId ?? genUniqueId(),
      type: metadata?.domain?.includes('resource')
        ? 'resource'
        : metadata?.domain?.includes('document')
          ? 'document'
          : 'skillResponse',
      position: { x: 0, y: 0 },
      data: {
        entityId: metadata?.entityId ?? '',
        title: metadata?.title ?? 'Selected Content',
        metadata: {
          contentPreview: content.content,
          selectedContent: content.content,
          sourceEntityId: metadata?.entityId ?? '',
          sourceEntityType: metadata?.domain?.split('Selection')[0] ?? '',
          sourceType: metadata?.domain ?? '',
          ...(metadata?.url && { url: metadata.url }),
        },
      },
    });
  });

  // Convert resources
  context.resources?.forEach((resource: SkillContextResourceItem) => {
    items.push({
      id: resource.metadata?.nodeId ?? genUniqueId(),
      type: 'resource',
      position: { x: 0, y: 0 },
      data: {
        entityId: resource.resourceId ?? '',
        title: resource.resource?.title ?? 'Resource',
        metadata: resource.metadata ?? {},
      },
      isPreview: resource.isCurrent ? true : false,
      isCurrentContext: resource.isCurrent,
    });
  });

  // Convert documents
  context.documents?.forEach((doc: SkillContextDocumentItem) => {
    items.push({
      id: doc.metadata?.nodeId ?? genUniqueId(),
      type: 'document',
      position: { x: 0, y: 0 },
      data: {
        entityId: doc.docId ?? '',
        title: doc.document?.title ?? 'Document',
        metadata: doc.metadata ?? {},
      },
      isPreview: doc.isCurrent ? true : false,
      isCurrentContext: doc.isCurrent,
    });
  });

  return items;
};

const convertContextItemsToContext = (items: IContextItem[]) => {
  return {
    contentList: items
      ?.filter((item) => item?.data?.metadata?.sourceType)
      .map((item) => ({
        content: item.data?.metadata?.selectedContent ?? '',
        metadata: {
          domain: item.data?.metadata?.sourceType ?? '',
          entityId: item.data?.entityId ?? '',
          title: item.data?.title ?? '',
          nodeId: item.id,
          ...(item.data?.metadata?.sourceType === 'extensionWeblinkSelection' && {
            url: item.data?.metadata?.url,
          }),
        },
      })),
    resources: items
      .filter((item) => item.type === 'resource')
      .map((item) => ({
        resourceId: item.data?.entityId || item.id,
        isCurrent: item.isCurrentContext,
        metadata: {
          ...item.data?.metadata,
          nodeId: item.id,
        },
      })),
    documents: items
      .filter((item) => item.type === 'document')
      .map((item) => ({
        docId: item.data?.entityId || item.id,
        isCurrent: item.isCurrentContext,
        metadata: {
          ...item.data?.metadata,
          nodeId: item.id,
        },
      })),
  };
};

export { convertContextToItems, convertContextItemsToContext };
