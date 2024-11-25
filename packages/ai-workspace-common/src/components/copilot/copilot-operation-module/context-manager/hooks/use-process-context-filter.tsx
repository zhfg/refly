import { useEffect, useState } from 'react';

import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useContextFilterConfigStore } from '@refly-packages/ai-workspace-common/stores/use-context-filter-config';

import { useProcessContextItems } from './use-process-context-items';
import { useDebouncedCallback } from 'use-debounce';

import { SkillContextRuleGroup, SkillContextKey } from '@refly/openapi-schema';

import { useTranslation } from 'react-i18next';

export interface FilterConfig {
  type: SkillContextKey[];
}

const MAX_LIMIT = 50;
const DISABLED_LIMIT = 0;

const typeMap = {
  resources: 'resource',
  canvases: 'canvas',
  projects: 'project',
};

const defaultConfig: SkillContextRuleGroup = {
  rules: [
    { key: 'resources', limit: MAX_LIMIT, required: false },
    { key: 'canvases', limit: MAX_LIMIT, required: false },
    { key: 'projects', limit: MAX_LIMIT, required: false },
    {
      key: 'contentList',
      limit: MAX_LIMIT,
      required: false,
    },
  ],
  preferredContextKeys: ['resources', 'canvases', 'projects', 'contentList'],
  relation: 'regular',
};

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
    selectedSkill: state.selectedSkillInstance,
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
        config.type.push(rule.key);
      });
    } else {
      const defaultKey = initialConfigRule?.preferredContextKeys?.[0];

      const ruleFirst = defaultKey
        ? initialConfigRule?.rules?.find((rule) => rule.key === defaultKey)
        : initialConfigRule?.rules?.[0];

      if (ruleFirst?.limit > 0) {
        config.type = [ruleFirst?.key];
      }
    }

    config.type = config.type.filter(Boolean);

    return config;
  };

  const [config, setConfig] = useState<FilterConfig>({
    type: [],
  });

  const isMutiType = initialConfigRule?.relation !== 'mutuallyExclusive';

  const isTypeDisabled = (type: string) => {
    return (
      initialConfigRule?.rules?.length &&
      (!initialConfigRule.rules.some((rule) => rule.key === type) ||
        initialConfigRule.rules.find((rule) => rule.key === type)?.limit === DISABLED_LIMIT)
    );
  };

  const getConfigLimit = (type: string, initialConfigRule: SkillContextRuleGroup) => {
    return initialConfigRule?.rules?.find((rule) => rule.key === type)?.limit || MAX_LIMIT;
  };

  const getConfigRequired = (type: string, initialConfigRule: SkillContextRuleGroup) => {
    return initialConfigRule?.rules?.find((rule) => rule.key === type)?.required || false;
  };

  // update config
  const updateConfig = (field: keyof FilterConfig, value: SkillContextKey, muti?: boolean) => {
    if (muti) {
      setConfig((prev) => {
        const updatedField = prev[field].includes(value)
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value];
        const newConfig = { ...prev, [field]: updatedField };
        return newConfig;
      });
    } else {
      setConfig((prev) => {
        const newConfig = { ...prev, [field]: [value] };
        return newConfig;
      });
    }
  };

  const setFilterErrorInfo = (config: FilterConfig, initialConfigRule: SkillContextRuleGroup) => {
    const type = config.type || [];
    const filterErrorInfo = {};

    type.forEach((type) => {
      const limit = getConfigLimit(type, initialConfigRule);
      const required = getConfigRequired(type, initialConfigRule);
      const currentCount = contextItemIdsByType[type]?.length || 0;
      if (currentCount > limit || (required && !currentCount)) {
        filterErrorInfo[typeMap[type] || type] = {
          required: currentCount === 0 && required,
          limit: limit,
          currentCount: currentCount,
        };
      }
    });
    updateFilterErrorInfo(filterErrorInfo);
  };

  const filterApply = (config: FilterConfig, initialConfigRule: SkillContextRuleGroup) => {
    const filteredIds = [];
    Object.keys(contextItemIdsByType).forEach((type) => {
      if (!config.type.includes(type as SkillContextKey)) {
        filteredIds.push(...contextItemIdsByType[type]);
        return;
      }
    });

    setFilterErrorInfo(config, initialConfigRule);

    updateFilterIdsOfCurrentSelectedMarks(filteredIds);
    useContextFilterConfig.setConfig(config);
  };

  const getConfigOfStore = () => {
    setConfig(useContextFilterConfig?.config || { type: [] });
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
    const context = selectedSkill?.invocationConfig?.context || ({} as SkillContextRuleGroup);
    let config: SkillContextRuleGroup;

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
    isMutiType,
    getConfigOfStore,
    isTypeDisabled,
    getConfigLimit,
    updateConfig,
    filterApply,
    resetConfig,
  };
};
