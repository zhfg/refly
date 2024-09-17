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
    const { checkedKeys, selectedWeblinks, currentSelectedMarks } = contextPanelStore;
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
            domain: item?.domain,
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

    const getUrls = (domain: ContextPanelDomain, checkedKeys: string[]) => {
      let ids: string[] = checkedKeys
        ?.filter((key: string = '') => {
          if (key?.startsWith(`${domain}-`)) {
            return true;
          }

          return false;
        })
        .map((key) => {
          const id = key?.split('_')?.slice(-1)?.[0];
          return id;
        });

      ids = Array.from(new Set(ids?.filter((id) => !!id)));
      const urls = selectedWeblinks
        ?.filter((item) => {
          const id = item?.key?.split('_')?.slice(-1)?.[0];
          return ids?.includes(id);
        })
        .map((item) => item?.metadata?.resourceMeta?.url);

      if (checkedKeys?.includes(`currentPage-resource`) && getRuntime() !== 'web') {
        urls.push(currentResource?.data?.url);
      }

      return Array.from(new Set(urls)).map((item) => ({ url: item }));
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
      urls: getUrls('weblink', checkedKeys),
    };

    return context;
  };

  return {
    buildSkillContext,
  };
};
