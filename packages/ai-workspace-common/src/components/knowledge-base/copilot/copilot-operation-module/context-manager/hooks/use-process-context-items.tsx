import { Mark, MarkType } from '@refly/common-types';
import { useTranslation } from 'react-i18next';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getClientOrigin } from '@refly-packages/utils/url';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { getTypeIcon } from '../utils/icon';

export const useProcessContextItems = () => {
  const { t } = useTranslation();
  const { jumpToNote, jumpToKnowledgeBase, jumpToReadResource } = useKnowledgeBaseJumpNewPath();
  const currentSelectedMarks = useContextPanelStore((state) => state.currentSelectedMarks);

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
        return () => jumpToNote({ noteId: mark.id });
      } else {
        return `${baseUrl}/knowledge-base?noteId=${mark.id}`;
      }
    }

    if (mark.type === 'resource' || mark.type === 'resourceSelection') {
      if (isWebRuntime) {
        return () => jumpToReadResource({ resId: mark.id });
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

  const processedContextItems = currentSelectedMarks.map(mapMarkToItem);

  return { processedContextItems };
};
