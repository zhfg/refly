import { useEffect, useState } from 'react';

import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useContextFilterConfigStore } from '@refly-packages/ai-workspace-common/stores/use-context-filter-config';

import { useProcessContextItems } from './use-process-context-items';
import { useDebouncedCallback } from 'use-debounce';

import { SkillInvocationRuleGroup } from '@refly/openapi-schema';
import { SelectedTextDomain } from '@refly/common-types';

export interface FilterConfig {
  type: string[];
  contentListTypes: string[];
}

const typeMap = {
  resources: 'resource',
  notes: 'note',
  collections: 'collection',
};

const defaultConfig: SkillInvocationRuleGroup = {
  rules: [
    { key: 'resources', limit: 10 },
    { key: 'notes', limit: 10 },
    { key: 'collections', limit: 10 },
    {
      key: 'contentList',
      limit: 1,
      rules: [
        { key: 'resourceSelection' as SelectedTextDomain, limit: 1 },
        { key: 'noteSelection' as SelectedTextDomain, limit: 1 },
        { key: 'extensionWeblinkSelection' as SelectedTextDomain, limit: 1 },
        { key: 'noteCursorSelection' as SelectedTextDomain, limit: 1 },
        { key: 'noteBeforeCursorSelection' as SelectedTextDomain, limit: 1 },
        { key: 'noteAfterCursorSelection' as SelectedTextDomain, limit: 1 },
      ],
      relation: 'mutuallyExclusive',
    },
  ],
  relation: 'mutuallyExclusive',
};

const contentListTypeList = [
  'resourceSelection',
  'noteSelection',
  'extensionWeblinkSelection',
  'noteCursorSelection',
  'noteBeforeCursorSelection',
  'noteAfterCursorSelection',
];

export const useProcessContextFilter = (filterNow = false) => {
  const { contextItemIdsByType } = useProcessContextItems();

  const { currentSelectedMarks, updateFilterIdsOfCurrentSelectedMarks, updateFilterErrorInfo } = useContextPanelStore(
    (state) => ({
      updateFilterIdsOfCurrentSelectedMarks: state.updateFilterIdsOfCurrentSelectedMarks,
      updateFilterErrorInfo: state.updateFilterErrorInfo,
      currentSelectedMarks: state.currentSelectedMarks,
    }),
  );

  const skillStore = useSkillStore((state) => ({
    selectedSkill: state.selectedSkill,
  }));

  const useContextFilterConfig = useContextFilterConfigStore((state) => ({
    config: state.config,
    useConfigOfStore: state.useConfigOfStore,
    setConfig: state.setConfig,
    setUseConfigOfStore: state.setUseConfigOfStore,
  }));

  const [initialConfigRule, setInitialConfigRule] = useState<SkillInvocationRuleGroup>(defaultConfig);

  // initail config
  const getInitialConfig = (initialConfigRule: SkillInvocationRuleGroup) => {
    const config = {
      type: [],
      contentListTypes: [],
    };

    if (useContextFilterConfig.useConfigOfStore) {
      const config = {
        type: [...useContextFilterConfig.config.type],
        contentListTypes: [...useContextFilterConfig.config.contentListTypes],
      };
      useContextFilterConfig.setUseConfigOfStore(false);
      return config;
    }

    if (initialConfigRule?.relation !== 'mutuallyExclusive') {
      (initialConfigRule.rules || []).forEach((rule) => {
        if (rule.key === 'contentList') {
          config.contentListTypes =
            rule.relation !== 'mutuallyExclusive' ? (rule?.rules || []).map((r) => r.key) : [rule?.rules?.[0]?.key];
        } else {
          config.type.push(rule.key);
        }
      });
    } else {
      config.type = [initialConfigRule?.rules?.[0]?.key];
    }

    config.type = config.type.filter(Boolean);
    config.contentListTypes = config.contentListTypes.filter(Boolean);

    if (config.contentListTypes.length) {
      config.type.push('contentList');
    }
    return config;
  };

  const [config, setConfig] = useState<FilterConfig>({
    type: [],
    contentListTypes: [],
  });

  const [contentListConfig, setContentListConfig] = useState<string[]>(contentListTypeList);

  const isMutiType = initialConfigRule?.relation !== 'mutuallyExclusive';
  const contentListRule = initialConfigRule.rules?.find((rule) => rule.key === 'contentList');
  const isMutiContentListType = contentListRule?.relation !== 'mutuallyExclusive';

  const isContentList = (type: string) => {
    return !['resource', 'note', 'collection', 'resources', 'notes', 'collections'].includes(type);
  };

  const isTypeDisabled = (type: string) => {
    if (isContentList(type)) {
      return !contentListRule?.rules?.length;
    }
    return initialConfigRule.rules?.length && !initialConfigRule.rules.some((rule) => rule.key === type);
  };

  const getConfigLimit = (type: string, initialConfigRule: SkillInvocationRuleGroup) => {
    if (isContentList(type)) {
      const contentListRule = initialConfigRule.rules?.find((rule) => rule.key === 'contentList');
      return contentListRule?.rules?.find((rule) => rule.key === type)?.limit || 10;
    }
    return initialConfigRule.rules?.find((rule) => rule.key.startsWith(type))?.limit || 10;
  };

  // update config
  const updateConfig = (field: keyof FilterConfig, value: string, muti?: boolean) => {
    if (muti) {
      setConfig((prev) => {
        const updatedField = prev[field].includes(value)
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value];
        return { ...prev, [field]: updatedField };
      });
    } else {
      setConfig((prev) => {
        return { ...prev, [field]: [value] };
      });
    }
  };

  const filterApply = (config: FilterConfig, initialConfigRule: SkillInvocationRuleGroup) => {
    const filteredIds = [];
    const filterErrorInfo = {};

    Object.keys(contextItemIdsByType).forEach((type) => {
      if (!config.type.includes(type) && !config.contentListTypes.includes(type)) {
        filteredIds.push(...contextItemIdsByType[type]);
        return;
      }

      const limit = isContentList(type)
        ? getConfigLimit(type, initialConfigRule)
        : getConfigLimit(type, initialConfigRule);

      const typeKey = typeMap[type] || type;

      if (config.type.includes(type)) {
        if (contextItemIdsByType[type].length > limit) {
          filterErrorInfo[typeKey] = {
            limit: limit,
            currentCount: contextItemIdsByType[type].length,
          };
        }
      }

      if (config.contentListTypes.includes(type)) {
        if (contextItemIdsByType[type].length > limit) {
          filterErrorInfo[typeKey] = {
            limit: limit,
            currentCount: contextItemIdsByType[type].length,
          };
        }
      }
    });
    console.log('filteredIds', filteredIds);
    updateFilterIdsOfCurrentSelectedMarks(filteredIds);
    console.log('filterErrorInfo', filterErrorInfo);
    updateFilterErrorInfo(filterErrorInfo);
  };

  // use debounce to limit the frequency of filterApply
  const debounceFilterApply = useDebouncedCallback(() => {
    filterApply(config, initialConfigRule);
  }, 300); // 300ms debounce

  const resetConfig = () => {
    setConfig(getInitialConfig(initialConfigRule));
  };

  useEffect(() => {
    const config = skillStore.selectedSkill?.invocationConfig?.context?.rules?.length
      ? skillStore.selectedSkill.invocationConfig.context
      : defaultConfig;

    setInitialConfigRule(config);
    const configType = getInitialConfig(config);
    setConfig(configType);

    if (filterNow) {
      filterApply(configType, config);
    }

    setContentListConfig(
      (config.rules.find((rule) => rule.key === 'contentList')?.rules || []).map((rule) => rule.key) || [],
    );
  }, [skillStore.selectedSkill?.skillId]);

  useEffect(() => {
    if (!skillStore.selectedSkill?.skillId) return;
    debounceFilterApply();

    return () => {
      debounceFilterApply.cancel();
    };
  }, [currentSelectedMarks.length, skillStore.selectedSkill?.skillId]);

  useEffect(() => {
    useContextFilterConfig.setConfig(config);
  }, [config]);

  return {
    initialConfigRule,
    config,
    contentListConfig,
    isMutiType,
    isMutiContentListType,
    isContentList,
    isTypeDisabled,
    getConfigLimit,
    updateConfig,
    filterApply,
    resetConfig,
  };
};
