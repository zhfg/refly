// 类型
import { SelectedTextDomain } from '@refly/common-types';
import { SkillContext, SkillContextContentItem } from '@refly/openapi-schema';
// request
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';

// types
import { MarkType, selectedTextDomains } from '@refly/common-types';

export const useBuildSkillContext = () => {
  const buildSkillContext = (): SkillContext => {
    const contextPanelStore = useContextPanelStore.getState();
    const { currentSelectedMarks, filterIdsOfCurrentSelectedMarks } = contextPanelStore;

    // projects
    const getDatabaseEntities = (type: MarkType) => {
      const set = new Set();
      const databaseEntities = currentSelectedMarks
        ?.filter((item) => ![item?.id, item?.entityId].includes('tempResId')) // filter extension only's mock tempResId
        ?.filter((item) => !filterIdsOfCurrentSelectedMarks.includes(item?.id) && item?.type === type)
        .map((item) => ({
          [`${type}Id`]: item?.entityId || item?.id,
          metadata: {
            ...(item?.metadata || {}),
            domain: item?.type,
            url: item?.url || '',
            title: item?.title || '',
            isCurrentContext: item?.isCurrentContext,
            projectId: item?.projectId,
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
        ?.filter((item) => !filterIdsOfCurrentSelectedMarks.includes(item?.id) && item?.type === 'extensionWeblink')
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
      const set = new Set();
      let contentList: SkillContextContentItem[] = [];
      // TODO: 这里需要处理技能执行时的 context filter

      contentList = currentSelectedMarks
        ?.filter(
          (item) =>
            (!filterIdsOfCurrentSelectedMarks.includes(item?.id) &&
              selectedTextDomains.includes(item?.type as SelectedTextDomain)) ||
            [item?.id, item?.entityId].includes('tempResId'), // filter extension only's mock tempResId
        )
        .map((item) => ({
          content: item?.data || '',
          metadata: {
            domain: item?.type,
            url: item?.url || '',
            title: item?.title || '',
            entityId: [item?.entityId, item?.id].includes('tempResId') ? '' : item?.entityId || item?.id || '',
          },
        }))
        .filter((item) => {
          if (set.has(`${item?.metadata?.entityId}-${item?.content}`)) {
            return false;
          }

          set.add(`${item?.metadata?.entityId}-${item?.content}`);
          return true;
        });

      return contentList;
    };

    let context: SkillContext = {
      contentList: getContentList(),
      resources: getDatabaseEntities('resource'),
      documents: getDatabaseEntities('document'),
      urls: getUrls(),
    };

    return context;
  };

  return {
    buildSkillContext,
  };
};
