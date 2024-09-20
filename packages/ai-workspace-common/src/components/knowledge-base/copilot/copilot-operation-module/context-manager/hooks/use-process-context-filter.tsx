import { useEffect, useState } from 'react';

import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useProcessContextItems } from './use-process-context-items';
import { useDebouncedCallback } from 'use-debounce';

import { SkillInvocationRuleGroup } from '@refly/openapi-schema';
import { SelectedTextDomain } from '@refly/common-types';

interface FilterConfig {
  type: string[];
  contentListTypes: string[];
}

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
  const { contextItemIdsByType, contextItemTypes } = useProcessContextItems();

  const { currentSelectedMarks, updateFilterIdsOfCurrentSelectedMarks } = useContextPanelStore((state) => ({
    updateFilterIdsOfCurrentSelectedMarks: state.updateFilterIdsOfCurrentSelectedMarks,
    currentSelectedMarks: state.currentSelectedMarks,
  }));

  const skillStore = useSkillStore((state) => ({
    selectedSkill: state.selectedSkill,
  }));

  const [initialConfig, setInitialConfig] = useState<SkillInvocationRuleGroup>(defaultConfig);

  // initail config
  const getInitialConfig = (initialConfig: SkillInvocationRuleGroup) => {
    console.log('initialConfiggggg', initialConfig);
    const config = {
      type: [],
      contentListTypes: [],
    };
    if (initialConfig?.relation !== 'mutuallyExclusive') {
      (initialConfig.rules || []).forEach((rule) => {
        if (rule.key === 'contentList') {
          config.contentListTypes =
            rule.relation !== 'mutuallyExclusive' ? (rule?.rules || []).map((r) => r.key) : [rule?.rules?.[0]?.key];
        } else {
          config.type.push(rule.key);
        }
      });
    } else {
      config.type = [initialConfig?.rules?.[0]?.key];
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

  const isMutiType = initialConfig?.relation !== 'mutuallyExclusive';
  const contentListRule = initialConfig.rules?.find((rule) => rule.key === 'contentList');
  const isMutiContentListType = contentListRule?.relation !== 'mutuallyExclusive';

  const isContentList = (type: string) => {
    return !['resource', 'note', 'collection', 'resources', 'notes', 'collections'].includes(type);
  };

  const isTypeDisabled = (type: string) => {
    if (isContentList(type)) {
      return !contentListRule?.rules?.length;
    }
    return initialConfig.rules?.length && !initialConfig.rules.some((rule) => rule.key === type);
  };

  const getConfigLimit = (type: string, initialConfig: SkillInvocationRuleGroup) => {
    if (isContentList(type)) {
      const contentListRule = initialConfig.rules?.find((rule) => rule.key === 'contentList');
      return contentListRule?.rules?.find((rule) => rule.key === type)?.limit || 10;
    }
    return initialConfig.rules?.find((rule) => rule.key.startsWith(type))?.limit || 10;
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

  const filterApply = (config: FilterConfig, initialConfig: SkillInvocationRuleGroup) => {
    console.log('filterApplyfilterApplyfilterApplyfilterApply', config, contextItemIdsByType);
    const filteredIds = [];
    Object.keys(contextItemIdsByType).forEach((type) => {
      if (config.type.includes(type)) {
        const limit = getConfigLimit(type, initialConfig);
        if (limit && contextItemIdsByType[type].length > limit) {
          filteredIds.push(...contextItemIdsByType[type].slice(limit));
        }
      }
      if (config.contentListTypes.includes(type)) {
        const limit = getConfigLimit(type, initialConfig);
        if (limit && contextItemIdsByType[type].length > limit) {
          filteredIds.push(...contextItemIdsByType[type].slice(limit));
        }
      }
    });
    console.log('filteredIds', filteredIds);
    updateFilterIdsOfCurrentSelectedMarks(filteredIds);
  };

  // 使用防抖或节流来限制 filterApply 的调用频率
  const debounceFilterApply = useDebouncedCallback(() => {
    filterApply(config, initialConfig);
  }, 300); // 300ms 延迟

  const resetConfig = () => {
    setConfig(getInitialConfig(initialConfig));
  };

  useEffect(() => {
    const config = skillStore.selectedSkill?.invocationConfig?.context?.rules?.length
      ? skillStore.selectedSkill.invocationConfig.context
      : defaultConfig;

    setInitialConfig(config);
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

  return {
    initialConfig,
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
