import { useGetCurrentSelectedMark } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-selected-text';
import { Mark, MarkType } from '@refly/common-types';
import { IconFile, IconBook, IconFolder, IconLink } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { useKnowledgeBaseJumpNewPath } from '@refly-packages/ai-workspace-common/hooks/use-jump-new-path';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { getClientOrigin } from '@refly-packages/utils/url';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

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

  const getTypeIcon = (mark: Mark) => {
    switch (mark.type) {
      case 'resource':
        return <IconFile />;
      case 'resourceSelection':
        return <IconFile />;
      case 'note':
        return <IconBook />;
      case 'noteSelection':
        return <IconBook />;
      case 'collection':
        return <IconFolder />;
      case 'extensionWeblink':
        return <IconLink />;
      case 'extensionWeblinkSelection':
        return <IconLink />;
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
