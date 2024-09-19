import React, { useState, useEffect, useMemo } from 'react';
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
  Typography,
  Empty,
} from '@arco-design/web-react';
import { IconFilter, IconSync, IconClose, IconCheck, IconArrowDown } from '@arco-design/web-react/icon';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useTranslation } from 'react-i18next';
import { SkillInvocationRule, SkillInvocationRuleGroup } from '@refly/openapi-schema';
import { selectedTextDomains, SelectedTextDomain } from '@refly/common-types';
import { useProcessContextItems } from '../../hooks/use-process-context-items';
import { PiNotepad, PiTextAlignRightBold } from 'react-icons/pi';
import { HiOutlineBookOpen } from 'react-icons/hi2';
import { LuFileText } from 'react-icons/lu';
import { IconRefresh } from '@arco-design/web-react/icon';

import './index.scss';
import { use } from 'node_modules/i18next';

const iconStyle = { fontSize: 10, transform: 'translateY(1px)', marginRight: 6, color: 'rgb(0, 0, 0, 0.6)' };

const FormItem = Form.Item;

interface FilterConfig {
  type: string[];
  contentListTypes: string[];
}

type ContextFilterProps = {
  initialConfig?: SkillInvocationRuleGroup;
  onFilterChange: (newConfig: SkillInvocationRuleGroup) => void;
};

type ContextFilterPopoverContentProps = {
  initialConfig?: SkillInvocationRuleGroup;
  handleVisibleChange?: (visible: boolean) => void;
  onFilterChange: (newConfig: SkillInvocationRuleGroup) => void;
};

const defaultLimit = 16;
const defaultMaxLimit = 16;
const defaultTypeList = ['resources', 'notes', 'collections', 'contentList'];
const contentListTypeList = [
  'resourceSelection',
  'noteSelection',
  'extensionWeblinkSelection',
  'noteCursorSelection',
  'noteBeforeCursorSelection',
  'noteAfterCursorSelection',
];

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

const ContextFilterPopoverContent: React.FC<ContextFilterPopoverContentProps> = ({
  initialConfig,
  handleVisibleChange,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  // initail config
  const getInitialConfig = () => {
    const config = {
      type: [],
      contentListTypes: [],
    };
    if (initialConfig?.relation === 'mutuallyExclusive') {
      (initialConfig.rules || []).forEach((rule) => {
        if (rule.key === 'contentList') {
          config.contentListTypes =
            rule.relation === 'mutuallyExclusive' ? (rule?.rules || []).map((r) => r.key) : [rule?.rules?.[0]?.key];
        } else {
          config.type.push(rule.key);
        }
      });
    } else {
      config.type = [initialConfig?.rules?.[0]?.key];
    }
    config.type = config.type.filter(Boolean);
    config.contentListTypes = config.contentListTypes.filter(Boolean);
    return config;
  };

  // state
  const [config, setConfig] = useState<FilterConfig>(getInitialConfig());

  const [filters, setFilters] = useState<string[]>([]);
  const [contentListConfig, setContentListConfig] = useState<string[]>(contentListTypeList);

  const isMutiType = !!(initialConfig.relation === 'mutuallyExclusive' || !initialConfig.rules?.length);
  const contentListRule = initialConfig.rules?.find((rule) => rule.key === 'contentList');
  const isMutiContentListType = !!(
    contentListRule?.relation === 'mutuallyExclusive' || !contentListRule?.rules?.length
  );
  const { contextItemTypes } = useProcessContextItems();

  const isTypeDisabled = (type: string) => {
    return initialConfig.rules?.length && !initialConfig.rules.some((rule) => rule.key === type);
  };

  const isContentList = (type: string) => {
    return !['resource', 'note', 'collection', 'resources', 'notes', 'collections'].includes(type);
  };

  const getConfigLimit = (type: string) => {
    if (isContentList(type)) {
      const contentListRule = initialConfig.rules?.find((rule) => rule.key === 'contentList') || {};
      return contentListRule?.rules?.find((rule) => rule.key === type)?.limit || 10;
    }
    return initialConfig.rules?.find((rule) => rule.key.startsWith(type))?.limit || 10;
  };

  // 更新配置
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

  const handleApply = () => {
    handleVisibleChange(false);
    const newConfig = {
      relation: initialConfig.relation,
      rules: [
        ...config.type.map((type) => ({
          key: type,
          limit: getConfigLimit(type),
        })),
        ...config.contentListTypes.map((type) => ({
          key: type,
          limit: getConfigLimit(type),
        })),
      ],
    };
    console.log('newConfig', newConfig);
    onFilterChange(newConfig as SkillInvocationRuleGroup);
  };

  // 生成过滤条件
  useEffect(() => {
    const newFilters = [
      ...config.type.filter((t) => t !== 'contentList'),
      ...(config.type.includes('contentList') ? config.contentListTypes : []),
    ];

    console.log('config', config, newFilters.filter(Boolean));
    setFilters(newFilters.filter(Boolean));
  }, [config]);

  // useEffect(() => {
  //   setContentListConfig(
  //     (initialConfig.rules.find((rule) => rule.key === 'contentList')?.rules || []).map((rule) => rule.key) || [],
  //   );
  // }, [initialConfig]);

  const filteredContextItemTypes = useMemo(() => {
    return Object.keys(contextItemTypes).reduce((acc, type) => {
      if (
        filters.some((f) => {
          return f === type + 's' || f === type;
        })
      ) {
        acc[type] = contextItemTypes[type];
      }
      return acc;
    }, {});
  }, [contextItemTypes, filters]);

  return (
    <div className="context-filter-popover__content">
      <div className="config-title">上下文过滤器</div>
      <div className="config-module">
        <div className="config-type">
          <div className="config-type__title">配置类型</div>

          <div className="config-type__content">
            {defaultTypeList.map((type) => (
              <Checkbox
                key={type}
                className={`config-type__item ${!isMutiType ? 'config-type__item-radio' : ''} `}
                checked={config.type.includes(type)}
                disabled={isTypeDisabled(type)}
                value={type}
                onChange={() => updateConfig('type', type, isMutiType)}
              >
                {({ checked }) => {
                  return (
                    <div className={`custom-checkbox-card ${checked ? 'custom-checkbox-card-checked' : ''}`}>
                      <div className="custom-checkbox-card-mask">
                        <IconCheck className="custom-checkbox-card-mask-check" />
                      </div>
                      <div className="custom-checkbox-card-title">
                        <Typography.Text ellipsis={{ showTooltip: true, rows: 1 }}>{type}</Typography.Text>
                      </div>
                    </div>
                  );
                }}
              </Checkbox>
            ))}
          </div>
        </div>

        {config.type.includes('contentList') && contentListConfig.length > 0 && (
          <div className="config-type">
            <div className="config-type__title">配置选中内容类型</div>
            <div className="config-type__content">
              {contentListConfig.map((type) => (
                <Checkbox
                  key={type}
                  className={`config-type__item ${!isMutiContentListType ? 'config-type__item-radio' : ''} `}
                  checked={config.contentListTypes.includes(type)}
                  value={type}
                  onChange={() => updateConfig('contentListTypes', type, isMutiContentListType)}
                >
                  {({ checked }) => {
                    return (
                      <div className={`custom-checkbox-card ${checked ? 'custom-checkbox-card-checked' : ''}`}>
                        <div className="custom-checkbox-card-mask">
                          <IconCheck className="custom-checkbox-card-mask-check" />
                        </div>
                        <Typography.Text ellipsis={{ showTooltip: true, rows: 1 }}>{type}</Typography.Text>
                      </div>
                    );
                  }}
                </Checkbox>
              ))}
            </div>
          </div>
        )}
      </div>
      {filters.length > 0 && (
        <div>
          <Divider>
            结果
            <IconArrowDown />
          </Divider>
          <div className="filter-preview-title">过滤条件</div>
          <div className="filter-preview">
            {Object.keys(filteredContextItemTypes).length ? (
              Object.keys(filteredContextItemTypes).map((type) => (
                <div key={type} className="filter-item">
                  {type === 'note' && <PiNotepad style={iconStyle} />}
                  {type === 'collection' && <HiOutlineBookOpen style={iconStyle} />}
                  {type === 'resource' && <LuFileText style={iconStyle} />}
                  {isContentList(type) && <PiTextAlignRightBold style={iconStyle} />}

                  <Typography.Text ellipsis={{ showTooltip: true, rows: 1 }}>
                    {isContentList(type) ? 'contentList.' : ''}
                    {type}
                  </Typography.Text>
                  <div className="filter-item-limit">
                    <span style={{ color: getConfigLimit(type) >= contextItemTypes[type] ? 'green' : 'red' }}>
                      {contextItemTypes[type]}{' '}
                    </span>
                    / {getConfigLimit(type)}
                  </div>
                </div>
              ))
            ) : (
              <Empty description="未命中过滤条件" className="filter-empty" />
            )}
          </div>
        </div>
      )}
      <div className="config-footer">
        <Button type="dashed" icon={<IconRefresh />} onClick={() => setConfig(getInitialConfig())}>
          重置
        </Button>
        <div className="config-footer-right">
          <Button onClick={() => handleVisibleChange(false)}>取消</Button>
          <Button type="primary" onClick={handleApply}>
            应用
          </Button>
        </div>
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
    console.log('initialConfig', initialConfig);
  }, [initialConfig, form]);

  return (
    <Popover
      position="bottom"
      trigger="click"
      className="context-filter-popover"
      content={
        <ContextFilterPopoverContent
          initialConfig={initialConfig}
          handleVisibleChange={handleVisibleChange}
          onFilterChange={onFilterChange}
        />
      }
      popupVisible={visible}
      onVisibleChange={handleVisibleChange}
    >
      <Tooltip content={t('knowledgeBase.context.contextFilter.acitveBtnTitle')} getPopupContainer={getPopupContainer}>
        <Button
          size="mini"
          type="outline"
          style={{ fontSize: 10, height: 18, borderRadius: 4, borderColor: '#e5e5e5', color: 'rgba(0,0,0,0.6)' }}
          icon={<IconFilter />}
          // onClick={() => {
          //   form.submit();
          // }}
        />
      </Tooltip>
    </Popover>
  );
};
