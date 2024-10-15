import { Mark, MarkType } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getClientOrigin } from '@refly-packages/utils/url';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getTypeIcon } from '../utils/icon';
import { mapSelectionTypeToContentList } from '../utils/contentListSelection';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';
import { useNoteTabs } from '@refly-packages/ai-workspace-common/hooks/use-note-tabs';

export const useProcessContextItems = () => {
  const { t } = useTranslation();
  const { jumpToNote, jumpToKnowledgeBase, jumpToReadResource } = useKnowledgeBaseJumpNewPath();
  const currentSelectedMarks = useContextPanelStore((state) => state.currentSelectedMarks);

  const { handleAddTab: handleAddResourceTab } = useKnowledgeBaseTabs();
  const { handleAddTab: handleAddNoteTab } = useNoteTabs();

  const getTypeName = (type: MarkType) => {
    switch (type) {
      case 'resource':
        return t('knowledgeBase.context.resource');
      case 'note':
        return t('knowledgeBase.context.note');
      case 'collection':
        return t('knowledgeBase.context.collection');
      case 'extensionWeblink':
        return t('knowledgeBase.context.extensionWeblink');
      case 'extensionWeblinkSelection':
        return t('knowledgeBase.context.extensionWeblinkSelection');
      case 'noteSelection':
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

    if (mark.type === 'note' || mark.type === 'noteSelection') {
      if (isWebRuntime) {
        return () => {
          jumpToNote({ noteId: mark.id });
          handleAddNoteTab({
            title: mark.title,
            key: mark.id,
            content: '',
            noteId: mark.id,
          });
        };
      } else {
        return `${baseUrl}/knowledge-base?noteId=${mark.id}`;
      }
    }

    if (mark.type === 'resource' || mark.type === 'resourceSelection') {
      if (isWebRuntime) {
        return () => {
          jumpToReadResource({ resId: mark.id });
          handleAddResourceTab({
            title: mark.title,
            key: mark.id,
            content: '',
            resourceId: mark.id,
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
      icon: getTypeIcon(mark),
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

  return { processedContextItems, contextItemTypes, contextItemIdsByType };
};
