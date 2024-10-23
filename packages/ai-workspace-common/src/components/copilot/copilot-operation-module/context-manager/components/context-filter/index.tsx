import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Tooltip,
  Popover,
  InputNumber,
  Checkbox,
  Slider,
  Divider,
  Typography,
  Empty,
} from '@arco-design/web-react';
import { IconFilter, IconCheck, IconArrowDown } from '@arco-design/web-react/icon';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useTranslation } from 'react-i18next';
import { useProcessContextItems } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module/context-manager/hooks/use-process-context-items';
import { PiNotepad, PiTextAlignRightBold } from 'react-icons/pi';
import { HiOutlineBookOpen } from 'react-icons/hi2';
import { LuFileText } from 'react-icons/lu';
import { IconRefresh } from '@arco-design/web-react/icon';
import { SkillContextRuleGroup } from '@refly/openapi-schema';

import './index.scss';

const iconStyle = { fontSize: 10, transform: 'translateY(1px)', marginRight: 6, color: 'rgb(0, 0, 0, 0.6)' };

interface UseProcessContextFilterProps {
  config: FilterConfig;
  initialConfigRule: SkillContextRuleGroup;
  isMutiType: boolean;
  getConfigOfStore: () => void;
  isTypeDisabled: (type: string) => boolean;
  getConfigLimit: (type: string, initialConfigRule: SkillContextRuleGroup) => number;
  updateConfig: (type: string, value: string, isMutiType: boolean) => void;
  filterApply: (config: FilterConfig, initialConfigRule: SkillContextRuleGroup) => void;
  resetConfig: () => void;
}

type ContextFilterPopoverContentProps = {
  handleVisibleChange?: (visible: boolean) => void;
  processContextFilterProps: UseProcessContextFilterProps;
};

interface FilterConfig {
  type: string[];
}

const defaultTypeList = ['resources', 'notes', 'projects', 'contentList'];
const typeMap = {
  resource: 'resources',
  note: 'notes',
  project: 'projects',
};

const ContextFilterPopoverContent: React.FC<ContextFilterPopoverContentProps> = ({
  handleVisibleChange,
  processContextFilterProps,
}) => {
  const { t } = useTranslation();

  const {
    initialConfigRule,
    config,
    isMutiType,
    isTypeDisabled,
    getConfigLimit,
    updateConfig,
    filterApply,
    resetConfig,
  } = processContextFilterProps;
  const [filters, setFilters] = useState<string[]>([]);
  const { contextItemTypes } = useProcessContextItems();

  const handleApply = () => {
    filterApply(config, initialConfigRule);
    handleVisibleChange(false);
  };

  // get filter list
  useEffect(() => {
    const newFilters = [...config?.type];
    setFilters(newFilters.filter(Boolean));
  }, [config]);

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
      <div className="config-title">{t('knowledgeBase.context.contextFilter.acitveBtnTitle')}</div>

      <div className="config-center">
        <div className="config-module">
          <div className="config-type">
            <div className="config-type__title">{t('knowledgeBase.context.contextFilter.selectType')}</div>

            <div className="config-type__content">
              {defaultTypeList.map((type) => (
                <Checkbox
                  key={type}
                  className={`config-type__item ${!isMutiType ? 'config-type__item-radio' : ''} `}
                  checked={config?.type.includes(type)}
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
                          <Typography.Text ellipsis={{ showTooltip: true, rows: 1 }}>
                            {t(`knowledgeBase.context.${type}`)}
                          </Typography.Text>
                        </div>
                      </div>
                    );
                  }}
                </Checkbox>
              ))}
            </div>
          </div>
        </div>

        {filters.length > 0 && (
          <div>
            <Divider>
              {t('knowledgeBase.context.contextFilter.result')}
              <IconArrowDown />
            </Divider>

            <div className="filter-preview-title">{t('knowledgeBase.context.contextFilter.filterConditions')}</div>
            <div className="filter-preview">
              {Object.keys(filteredContextItemTypes).length ? (
                Object.keys(filteredContextItemTypes).map((type) => (
                  <div key={type} className="filter-item">
                    {type === 'note' && <PiNotepad style={iconStyle} />}
                    {type === 'project' && <HiOutlineBookOpen style={iconStyle} />}
                    {type === 'resource' && <LuFileText style={iconStyle} />}
                    {type === 'contentList' && <PiTextAlignRightBold style={iconStyle} />}

                    <Typography.Text ellipsis={{ showTooltip: true, rows: 1 }}>
                      {t(`knowledgeBase.context.${type}`)}
                    </Typography.Text>
                    <div className="filter-item-limit">
                      <span
                        style={{
                          color:
                            getConfigLimit(typeMap[type] || type, initialConfigRule) >= contextItemTypes[type]
                              ? 'green'
                              : 'red',
                        }}
                      >
                        {contextItemTypes[type]}{' '}
                      </span>
                      / {getConfigLimit(typeMap[type] || type, initialConfigRule)}
                    </div>
                  </div>
                ))
              ) : (
                <Empty description={t('knowledgeBase.context.contextFilter.empty')} className="filter-empty" />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="config-footer">
        <Button type="dashed" icon={<IconRefresh />} onClick={() => resetConfig()}>
          {t('common.reset')}
        </Button>
        <div className="config-footer-right">
          <Button onClick={() => handleVisibleChange(false)}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={handleApply}>
            {t('common.apply')}
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

interface ContextFilterProps {
  processContextFilterProps: UseProcessContextFilterProps;
}

export const ContextFilter: React.FC<ContextFilterProps> = ({ processContextFilterProps }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible);
    if (visible) {
      processContextFilterProps.getConfigOfStore();
    }
  };

  return (
    <Popover
      position="bottom"
      trigger="click"
      className="context-filter-popover"
      content={
        <ContextFilterPopoverContent
          processContextFilterProps={processContextFilterProps}
          handleVisibleChange={handleVisibleChange}
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
        />
      </Tooltip>
    </Popover>
  );
};
