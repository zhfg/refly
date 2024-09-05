// 类型
import { ContextPanelDomain, LOCALE } from '@refly/common-types';
import { Resource, SkillContext } from '@refly/openapi-schema';
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

      return Array.from(new Set(urls));
    };

    const getContentList = () => {
      let contentList = [];
      const finalUsedMarks = getFinalUsedMarks(contextPanelStore);

      if (enableMultiSelect) {
        contentList = (finalUsedMarks || []).map((item) => item?.data);
      } else {
        contentList.push(currentSelectedMark?.data);
      }

      return contentList;
    };

    const getExternalResources = () => {
      const externalResources: Resource[] = [];
      if (checkedKeys?.includes(`currentPage-resource`) && getRuntime() !== 'web') {
        externalResources.push({
          resourceType: 'text',
          title: currentResource?.title || '',
          resourceId: '',
          data: {
            url: currentResource?.data?.url || '',
          },
          content: currentResource?.content || '',
          contentPreview: currentResource?.contentPreview || '',
          createdAt: currentResource?.createdAt || '',
          updatedAt: currentResource?.updatedAt || '',
        });
      }

      return externalResources;
    };

    let context: SkillContext = {
      locale: localSettings?.outputLocale || LOCALE.EN,
      contentList: getContentList(),
      collectionIds: getIds('collection', checkedKeys),
      resourceIds: getIds('resource', checkedKeys),
      noteIds: getIds('note', checkedKeys),
      urls: getUrls('weblink', checkedKeys),
      externalResources: getExternalResources(),
    };

    return context;
  };

  return {
    buildSkillContext,
  };
};
