// 类型
import { ContextPanelDomain, LOCALE, SelectedTextDomain } from '@refly/common-types';
import { Resource, SkillContext, SkillContextContentItem } from '@refly/openapi-schema';
// request
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useGetCurrentSelectedMark } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-selected-text';
// types
import { MarkType, selectedTextDomains } from '@refly/common-types';

export const useBuildSkillContext = () => {
  const buildSkillContext = (): SkillContext => {
    const { localSettings } = useUserStore.getState();
    const { currentKnowledgeBase, currentResource } = useKnowledgeBaseStore.getState();
    const contextPanelStore = useContextPanelStore.getState();
    const { currentNote } = useNoteStore.getState();
    const { currentSelectedMarks } = contextPanelStore;
    const mapDomainEnvIds = {
      collection: currentKnowledgeBase?.collectionId || '',
      resource: currentResource?.resourceId || '',
      note: currentNote?.noteId || '',
    };

    // collections
    const getDatabaseEntities = (type: MarkType) => {
      const set = new Set();
      const databaseEntities = currentSelectedMarks
        ?.filter((item) => item?.type === type)
        .map((item) => ({
          [`${type}Id`]: item?.entityId || item?.id,
          metadata: {
            domain: item?.type,
            url: item?.url || '',
            title: item?.title || '',
          },
        }))
        .filter((item) => {
          if (set.has(item?.[`${type}Id`])) {
            return false;
          }

          set.add(item?.[`${type}Id`]);
          return true;
        });

      // for env context, just check `currentPage-currentKnowledgeBase` checked
      // if (checkedKeys?.includes(`currentPage-${domain}`) && getRuntime() === 'web') {
      //   ids.push(mapDomainEnvIds?.[domain] || '');
      // }

      return databaseEntities;
    };

    const getUrls = () => {
      const set = new Set();
      const urls = currentSelectedMarks
        ?.filter((item) => item?.type === 'extensionWeblink')
        .map((item) => ({
          url: (item?.url as string) || '',
          metadata: {
            id: item?.id,
            domain: item?.type,
            url: item?.url || '',
            title: item?.title || '',
          },
        }))
        .filter((item) => {
          if (set.has(item?.url)) {
            return false;
          }

          set.add(item?.url);
          return true;
        });

      return urls;
    };

    const getContentList = () => {
      let contentList: SkillContextContentItem[] = [];
      // TODO: 这里需要处理技能执行时的 context filter
      console.log('currentSelectedMarks', currentSelectedMarks);

      contentList = currentSelectedMarks
        ?.filter((item) => selectedTextDomains.includes(item?.type as SelectedTextDomain))
        .map((item) => ({
          content: item?.data || '',
          metadata: {
            domain: item?.type,
            url: item?.url || '',
            title: item?.title || '',
            entityId: item?.entityId || item?.id || '',
          },
        }));

      // if (checkedKeys?.includes(`currentPage-resource`) && getRuntime() !== 'web') {
      //   contentList.push({
      //     content: currentResource?.content || '',
      //     metadata: {
      //       domain: 'extensionWeblink',
      //       url: currentResource?.data?.url || '',
      //       title: currentResource?.title || '',
      //     },
      //   });
      // }

      return contentList;
    };

    let context: SkillContext = {
      contentList: getContentList(),
      collections: getDatabaseEntities('collection'),
      resources: getDatabaseEntities('resource'),
      notes: getDatabaseEntities('note'),
      urls: getUrls(),
    };

    return context;
  };

  return {
    buildSkillContext,
  };
};
