import { useEffect, useState } from 'react';

import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useContextFilterConfigStore } from '@refly-packages/ai-workspace-common/stores/use-context-filter-config';

import { useProcessContextItems } from './use-process-context-items';
import { useDebouncedCallback } from 'use-debounce';

import { SkillContextRuleGroup, SkillContextRule } from '@refly/openapi-schema';
import { SelectedTextDomain } from '@refly/common-types';

import { useTranslation } from 'react-i18next';
import { Notification } from '@arco-design/web-react';

export interface FilterConfig {
  type: string[];
  contentListTypes: string[];
}

const MAX_LIMIT = 50;
const DISABLED_LIMIT = 0;

const typeMap = {
  resources: 'resource',
  notes: 'note',
  collections: 'collection',
};

const defaultConfig: SkillContextRuleGroup = {
  rules: [
    { key: 'resources', limit: MAX_LIMIT, required: false },
    { key: 'notes', limit: MAX_LIMIT, required: false },
    { key: 'collections', limit: MAX_LIMIT, required: false },
    {
      key: 'contentList',
      limit: MAX_LIMIT,
      required: false,
      preferredSelectionKeys: [
        'resourceSelection',
        'noteSelection',
        'extensionWeblinkSelection',
        'noteCursorSelection',
        'noteBeforeCursorSelection',
        'noteAfterCursorSelection',
      ],
    },
  ],
  preferredContextKeys: ['resources', 'notes', 'collections', 'contentList'],
  relation: 'regular',
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
  const { t } = useTranslation();

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

  const [initialConfigRule, setInitialConfigRule] = useState<SkillContextRuleGroup>(defaultConfig);

  // initail config
  const getInitialConfig = (initialConfigRule: SkillContextRuleGroup, useConfigOfStore?: boolean) => {
    console.log('config==', initialConfigRule);
    const config: FilterConfig = {
      type: [],
      contentListTypes: [],
    };

    if (useConfigOfStore) {
      return useContextFilterConfig.config;
    }

    if (!initialConfigRule?.rules?.length) {
      return config;
    }

    if (initialConfigRule?.relation !== 'mutuallyExclusive') {
      const preferredContextKeys = initialConfigRule?.preferredContextKeys || [];
      (initialConfigRule.rules || []).forEach((rule) => {
        if (rule.limit <= 0 || (preferredContextKeys.length && !preferredContextKeys.includes(rule.key))) {
          return;
        }
        if (rule.key === 'contentList') {
          config.type.push(rule.key);
          config.contentListTypes = rule.preferredSelectionKeys?.length
            ? rule.preferredSelectionKeys
            : [...contentListTypeList];
        } else {
          config.type.push(rule.key);
        }
      });
    } else {
      const defaultKey = initialConfigRule?.preferredContextKeys?.[0];

      const ruleFirst = defaultKey
        ? initialConfigRule?.rules?.find((rule) => rule.key === defaultKey)
        : initialConfigRule?.rules?.[0];

      if (ruleFirst?.limit > 0) {
        config.type = [ruleFirst?.key];
        if (ruleFirst?.key === 'contentList') {
          config.contentListTypes = [...contentListTypeList];
        }
      }
    }

    config.type = config.type.filter(Boolean);
    config.contentListTypes = config.contentListTypes.filter(Boolean);

    return config;
  };

  const [config, setConfig] = useState<FilterConfig>({
    type: [],
    contentListTypes: [],
  });

  const [contentListConfig, setContentListConfig] = useState<string[]>(contentListTypeList);

  const isMutiType = initialConfigRule?.relation !== 'mutuallyExclusive';
  const isMutiContentListType = true;

  const isContentList = (type: string) => {
    return !['resources', 'notes', 'collections', 'urls', 'resource', 'note', 'collection', 'url'].includes(type);
  };

  const isTypeDisabled = (type: string) => {
    return (
      initialConfigRule?.rules?.length &&
      (!initialConfigRule.rules.some((rule) => rule.key === type) ||
        initialConfigRule.rules.find((rule) => rule.key === type)?.limit === DISABLED_LIMIT)
    );
  };

  const getConfigLimit = (type: string, initialConfigRule: SkillContextRuleGroup) => {
    if (isContentList(type)) {
      const contentListRule = initialConfigRule?.rules?.find((rule) => rule.key === 'contentList');
      return contentListRule?.limit || MAX_LIMIT;
    }
    return initialConfigRule?.rules?.find((rule) => rule.key === type)?.limit || MAX_LIMIT;
  };

  const getConfigRequired = (type: string, initialConfigRule: SkillContextRuleGroup) => {
    if (isContentList(type)) {
      return initialConfigRule?.rules?.find((rule) => rule.key === 'contentList')?.required || false;
    }
    return initialConfigRule?.rules?.find((rule) => rule.key === type)?.required || false;
  };

  // update config
  const updateConfig = (field: keyof FilterConfig, value: string, muti?: boolean) => {
    if (muti) {
      setConfig((prev) => {
        const updatedField = prev[field].includes(value)
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value];
        const newConfig = { ...prev, [field]: updatedField };
        if (!newConfig.type.includes('contentList')) {
          newConfig.contentListTypes = [];
        }
        return newConfig;
      });
    } else {
      setConfig((prev) => {
        const newConfig = { ...prev, [field]: [value] };
        if (!newConfig.type.includes('contentList')) {
          newConfig.contentListTypes = [];
        }
        return newConfig;
      });
    }
  };

  const getFilterErrorInfo = (config: FilterConfig, initialConfigRule: SkillContextRuleGroup) => {
    const type = config.type || [];
    const contentListTypes = config.contentListTypes || [];

    const filterErrorInfo = {};

    type.forEach((type) => {
      if (type === 'contentList') {
        return;
      }
      const limit = getConfigLimit(type, initialConfigRule);
      const required = getConfigRequired(type, initialConfigRule);
      const currentCount = contextItemIdsByType[type]?.length || 0;
      if (currentCount > limit || (required && !currentCount)) {
        filterErrorInfo[typeMap[type] || type] = {
          required: required,
          limit: limit,
          currentCount: currentCount,
        };
      }
    });

    contentListTypes.forEach((type) => {
      const limit = getConfigLimit(type, initialConfigRule);
      const required = getConfigRequired(type, initialConfigRule);
      const currentCount = contextItemIdsByType[type]?.length || 0;
      if (currentCount > limit || (required && !currentCount)) {
        filterErrorInfo[type] = {
          required: required,
          limit: limit,
          currentCount: currentCount,
        };
      }
    });
    updateFilterErrorInfo(filterErrorInfo);
  };

  const filterApply = (config: FilterConfig, initialConfigRule: SkillContextRuleGroup) => {
    if (config.type.includes('contentList') && !config.contentListTypes.length) {
      return () => {
        Notification.error({
          style: { width: 400 },
          content: t('knowledgeBase.context.contextFilter.contentListSelectedTypeRequired'),
        });
      };
    }

    const filteredIds = [];
    Object.keys(contextItemIdsByType).forEach((type) => {
      if (!config.type.includes(type) && !config.contentListTypes.includes(type)) {
        filteredIds.push(...contextItemIdsByType[type]);
        return;
      }
    });

    console.log('filteredIds', filteredIds);
    getFilterErrorInfo(config, initialConfigRule);

    updateFilterIdsOfCurrentSelectedMarks(filteredIds);
    useContextFilterConfig.setConfig(config);
  };

  const getConfigOfStore = () => {
    setConfig(useContextFilterConfig?.config || { type: [], contentListTypes: [] });
  };

  // use debounce to limit the frequency of filterApply
  const debounceFilterApply = useDebouncedCallback(() => {
    filterApply(config, initialConfigRule);
  }, 300); // 300ms debounce

  const resetConfig = () => {
    setConfig(getInitialConfig(initialConfigRule));
  };

  useEffect(() => {
    const selectedSkill = skillStore.selectedSkill;
    // const context = selectedSkill?.invocationConfig?.context || ({} as SkillContextRuleGroup);
    let config: SkillContextRuleGroup;
    const context = {
      rules: [
        {
          key: 'contentList',
          limit: 1,
          required: true,
          preferredSelectionKeys: ['resourceSelection', 'noteSelection'],
        },
      ],
      relation: 'regular',
    };

    if (!Object.keys(context).length) {
      config = JSON.parse(JSON.stringify(defaultConfig));
    } else {
      config = JSON.parse(JSON.stringify(context));
      if (!context?.rules?.length) {
        config.rules = JSON.parse(JSON.stringify(defaultConfig.rules));
        config.rules.forEach((rule) => {
          rule.limit = DISABLED_LIMIT;
        });
        config.preferredContextKeys = [];
        config.relation = 'mutuallyExclusive';
      }
    }

    setInitialConfigRule(config);
    const configType = getInitialConfig(config);
    setConfig(configType);

    if (filterNow) {
      filterApply(configType, config);
    }
  }, [skillStore.selectedSkill?.skillId]);

  useEffect(() => {
    debounceFilterApply();

    return () => {
      debounceFilterApply.cancel();
    };
  }, [currentSelectedMarks.length, skillStore.selectedSkill?.skillId]);

  return {
    initialConfigRule,
    config,
    contentListConfig,
    isMutiType,
    isMutiContentListType,
    getConfigOfStore,
    isContentList,
    isTypeDisabled,
    getConfigLimit,
    updateConfig,
    filterApply,
    resetConfig,
  };
};
