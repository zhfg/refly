import { Mark, MarkType } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getClientOrigin } from '@refly-packages/utils/url';
import { useContextPanelStoreShallow } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getTypeIcon } from '../utils/icon';
import { mapSelectionTypeToContentList } from '../utils/contentListSelection';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';
import { useCanvasTabs } from '@refly-packages/ai-workspace-common/hooks/use-note-tabs';

export const useProcessContextItems = () => {
  const { t } = useTranslation();
  const { jumpToCanvas, jumpToKnowledgeBase, jumpToReadResource } = useKnowledgeBaseJumpNewPath();
  const currentSelectedMarks = useContextPanelStoreShallow((state) => state.currentSelectedMarks);
  console.log('currentSelectedMarks', currentSelectedMarks);

  const { handleAddTab: handleAddResourceTab } = useKnowledgeBaseTabs();
  const { handleAddTab: handleAddCanvasTab } = useCanvasTabs();

  const getQueryParams = (url: string): Record<string, string> => {
    const params: Record<string, string> = {};
    const queryString = url.split('?')[1];
    if (!queryString) return params;

    const pairs = queryString.split('&');
    pairs.forEach((pair) => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });

    return params;
  };

  const getTypeName = (type: MarkType) => {
    switch (type) {
      case 'resource':
        return t('knowledgeBase.context.resource');
      case 'canvas':
        return t('knowledgeBase.context.note');
      case 'collection':
        return t('knowledgeBase.context.collection');
      case 'extensionWeblink':
        return t('knowledgeBase.context.extensionWeblink');
      case 'extensionWeblinkSelection':
        return t('knowledgeBase.context.extensionWeblinkSelection');
      case 'canvasSelection':
        return t('knowledgeBase.context.noteSelection');
      case 'resourceSelection':
        return t('knowledgeBase.context.resourceSelection');
    }
  };

  const getTypeUrl = (mark: Mark) => {
    const baseUrl = getClientOrigin();
    const isWebRuntime = getRuntime() === 'web';

    if (mark.type === 'extensionWeblink' || mark.type === 'extensionWeblinkSelection') {
      return mark.url;
    }

    if (mark.type === 'canvas' || mark.type === 'canvasSelection') {
      if (isWebRuntime) {
        const currentId = mark.type === 'canvas' ? mark.id : mark.parentId;
        return () => {
          jumpToCanvas({ canvasId: currentId });
          handleAddCanvasTab({
            title: mark.title,
            key: currentId,
            content: '',
            canvasId: currentId,
          });
        };
      } else {
        return `${baseUrl}/knowledge-base?noteId=${mark.id}`;
      }
    }

    if (mark.type === 'resource' || mark.type === 'resourceSelection') {
      if (isWebRuntime) {
        const currentId = mark.type === 'resource' ? mark.id : mark.parentId;
        return () => {
          jumpToReadResource({ resId: currentId });
          handleAddResourceTab({
            title: mark.title,
            key: currentId,
            content: '',
            resourceId: currentId,
          });
        };
      } else {
        return `${baseUrl}/knowledge-base?resId=${mark.id}`;
      }
    }

    if (mark.type === 'collection') {
      if (isWebRuntime) {
        return () => jumpToKnowledgeBase({ kbId: mark.id });
      } else {
        return `${baseUrl}/knowledge-base?kbId=${mark.id}`;
      }
    }
  };

  const mapMarkToItem = (mark: Mark): Mark => {
    return {
      ...mark,
      id: mark?.id,
      type: mark.type,
      active: mark?.active || false,
      url: getTypeUrl(mark),
      icon: getTypeIcon(mark.type),
      name: getTypeName(mark.type),
    };
  };

  const processedContextItems = (() => {
    const uniqueMarks = new Map<string, Mark>();

    currentSelectedMarks.forEach((mark) => {
      const key = `${mark.type}_${mark.id}`;
      if (!uniqueMarks.has(key)) {
        uniqueMarks.set(key, mapMarkToItem(mark));
      }
    });

    return Array.from(uniqueMarks.values());
  })();

  // TODO: use-build-skill-context need to be refactored and deduplicated
  const getcontextItemTypes = () => {
    const types: Record<string, number> = {
      resource: 0,
      note: 0,
      collection: 0,
      contentList: 0,
    };

    processedContextItems.forEach((item) => {
      const contextType = mapSelectionTypeToContentList(item.type);
      if (!types[contextType]) {
        types[contextType] = 1;
      } else {
        types[contextType] += 1;
      }
    });

    for (const type in types) {
      if (!types[type]) {
        delete types[type];
      }
    }

    return types;
  };

  const contextItemTypes = getcontextItemTypes();

  const getContextItemIdsByType = () => {
    const result: Record<string, string[]> = {};
    processedContextItems.forEach((item) => {
      let type = item.type as string;
      if (['resource', 'note', 'collection', 'url'].includes(item.type)) {
        type = type + 's';
      } else {
        type = 'contentList';
      }
      if (!result[type]) {
        result[type] = [];
      }
      result[type].push(item.id);
    });
    return result;
  };

  const contextItemIdsByType = getContextItemIdsByType();

  const processContextItemsFromMessage = (context: Record<string, any>) => {
    const contextItems = [];
    Object.keys(context).forEach((key) => {
      const itemList = context[key];
      itemList.forEach((item) => {
        const metadata = item.metadata || {};
        let typeKey = key;
        let id = '';
        let parentId = '';
        if (key === 'canvases') {
          id = item?.canvasId;
          typeKey = 'canvas';
        } else if (key === 'resources') {
          id = item?.resourceId;
          typeKey = 'resource';
        } else if (key === 'collections') {
          id = item?.collectionId;
          typeKey = 'collection';
        } else {
          id = metadata.entityId;
          typeKey = metadata.domain;
          const queryParams = getQueryParams(metadata.url || '') || {};
          if (typeKey === 'noteSelection') {
            parentId = queryParams.noteId;
          } else if (typeKey === 'resourceSelection') {
            parentId = queryParams.resId;
          }
        }

        const mark: Mark = {
          id,
          entityId: id,
          type: typeKey as MarkType,
          title: metadata.title,
          data: item?.content,
          domain: metadata.domain,
          icon: getTypeIcon(typeKey as MarkType),
          name: getTypeName(typeKey as MarkType),
          parentId,
        };

        mark.url = getTypeUrl(mark);

        contextItems.push(mark);
      });
    });
    return contextItems;
  };

  return { processedContextItems, contextItemTypes, contextItemIdsByType, processContextItemsFromMessage };
};
