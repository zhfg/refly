// 类型
import { ContextPanelDomain, LOCALE } from '@refly/common-types';
import { Resource, SkillContext, SkillContextContentItem } from '@refly/openapi-schema';
// request
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';
import { useGetCurrentSelectedMark } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-selected-text';

export const useBuildSkillContext = () => {
  const { getFinalUsedMarks } = useGetCurrentSelectedMark();
  const buildSkillContext = (): SkillContext => {
    const { localSettings } = useUserStore.getState();
    const { currentKnowledgeBase, currentResource } = useKnowledgeBaseStore.getState();
    const contextPanelStore = useContextPanelStore.getState();
    const { currentNote } = useNoteStore.getState();
    const { checkedKeys, selectedWeblinks, currentSelectedMark, enableMultiSelect, currentSelectedMarks } =
      contextPanelStore;
    const mapDomainEnvIds = {
      collection: currentKnowledgeBase?.collectionId || '',
      resource: currentResource?.resourceId || '',
      note: currentNote?.noteId || '',
    };

    // collections
    const getIds = (domain: ContextPanelDomain, checkedKeys: string[]) => {
      // for select collection context `collection-collection_1_${item?.id}`, get last item.id
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

      // for env context, just check `currentPage-currentKnowledgeBase` checked
      if (checkedKeys?.includes(`currentPage-${domain}`) && getRuntime() === 'web') {
        ids.push(mapDomainEnvIds?.[domain] || '');
      }

      return Array.from(new Set(ids?.filter((id) => !!id)));
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
      const finalUsedMarks = getFinalUsedMarks(contextPanelStore);

      if (enableMultiSelect) {
        contentList = (finalUsedMarks || []).map((item) => ({
          content: item?.data,
          metadata: {
            domain: item?.domain,
          },
        }));
      } else {
        contentList.push({
          content: currentSelectedMark?.data,
        });
      }

      if (checkedKeys?.includes(`currentPage-resource`) && getRuntime() !== 'web') {
        contentList.push({
          content: currentResource?.content || '',
          metadata: {
            domain: 'extensionWeblink',
            url: currentResource?.data?.url || '',
            title: currentResource?.title || '',
          },
        });
      }

      return contentList;
    };

    let context: SkillContext = {
      locale: localSettings?.outputLocale || LOCALE.EN,
      contentList: getContentList(),
      collections: getIds('collection', checkedKeys)?.map((item) => ({ collectionId: item })),
      resources: getIds('resource', checkedKeys)?.map((item) => ({ resourceId: item })),
      notes: getIds('note', checkedKeys)?.map((item) => ({ noteId: item })),
      urls: getUrls('weblink', checkedKeys),
    };

    return context;
  };

  return {
    buildSkillContext,
  };
};
