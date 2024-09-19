import React, { useState, useEffect } from 'react';
import {
  Button,
  Tooltip,
  Popover,
  InputNumber,
  Form,
  Switch,
  Checkbox,
  Radio,
  Slider,
  Divider,
} from '@arco-design/web-react';
import { IconFilter, IconSync, IconClose } from '@arco-design/web-react/icon';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useTranslation } from 'react-i18next';
import { SkillInvocationRule, SkillInvocationRuleGroup } from '@refly/openapi-schema';
import { selectedTextDomains, SelectedTextDomain } from '@refly/common-types';

import './index.scss';

const FormItem = Form.Item;

interface FilterConfig {
  type: string[];
  contentListTypes: string[];
}

type ContextFilterProps = {
  initialConfig?: SkillInvocationRuleGroup;
  onFilterChange: (newConfig: SkillInvocationRuleGroup) => void;
};

const defaultLimit = 16;
const defaultMaxLimit = 16;

const NumberInputWithSlider = ({ min, max, value, onChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <InputNumber
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        style={{ width: '60px', marginRight: '8px' }}
      />
      <Slider min={min} max={max} value={value} onChange={onChange} style={{ width: '100px' }} />
    </div>
  );
};

const ContextFilterPopoverContent: React.FC = () => {
  const [config, setConfig] = useState<FilterConfig>({
    type: [],
    contentListTypes: [],
  });
  const [filters, setFilters] = useState<string[]>([]);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  // 更新配置
  const updateConfig = (field: keyof FilterConfig, value: string) => {
    setConfig((prev) => {
      const updatedField = prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value];
      return { ...prev, [field]: updatedField };
    });
  };

  // 生成过滤条件
  useEffect(() => {
    const newFilters = [
      ...config.type.filter((t) => t !== 'contentList'),
      ...(config.type.includes('contentList') ? config.contentListTypes : []),
    ];
    setFilters(newFilters);
  }, [config]);

  // 切换过滤条件预览
  const toggleFilterPreview = (filter: string) => {
    setExpandedFilter(expandedFilter === filter ? null : filter);
  };

  return (
    <div className="context-filter-popover__content">
      <div className="config-module">
        <div className="type-config">
          {['resources', 'notes', 'collections', 'contentList'].map((type) => (
            <label key={type}>
              <input type="checkbox" checked={config.type.includes(type)} onChange={() => updateConfig('type', type)} />
              {type}
            </label>
          ))}
        </div>
        {config.type.includes('contentList') && (
          <div className="content-list-config">
            {['resourceSelection', 'noteSelection', 'extensionWeblinkSelection'].map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={config.contentListTypes.includes(type)}
                  onChange={() => updateConfig('contentListTypes', type)}
                />
                {type}
              </label>
            ))}
          </div>
        )}
      </div>
      <hr />
      <div className="filter-preview">
        {filters.map((filter) => (
          <div key={filter} className="filter-item">
            <button onClick={() => toggleFilterPreview(filter)}>{filter}</button>
            {expandedFilter === filter && <div className="preview">Preview for {filter}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

type FilterCondition = {
  key: string;
  limit: number;
  initialLimit: number;
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

export const ContextFilter: React.FC<ContextFilterProps> = ({ initialConfig = defaultConfig, onFilterChange }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [config, setConfig] = useState<SkillInvocationRuleGroup>(initialConfig);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible);
  };

  useEffect(() => {
    setConfig(initialConfig);
    form.resetFields();
  }, [initialConfig, form]);

  return (
    <Popover
      position="bottom"
      trigger="click"
      className="context-filter-popover"
      content={<ContextFilterPopoverContent />}
      popupVisible={visible}
      onVisibleChange={handleVisibleChange}
    >
      <Tooltip content={t('knowledgeBase.context.contextFilter.acitveBtnTitle')} getPopupContainer={getPopupContainer}>
        <Button
          size="mini"
          type="outline"
          style={{ fontSize: 10, height: 18, borderRadius: 4, borderColor: '#e5e5e5', color: 'rgba(0,0,0,0.6)' }}
          icon={<IconFilter />}
          onClick={() => {
            form.submit();
          }}
        />
      </Tooltip>
    </Popover>
  );
};
