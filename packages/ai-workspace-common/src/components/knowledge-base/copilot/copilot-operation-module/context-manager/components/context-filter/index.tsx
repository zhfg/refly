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
import { useContextFilterConfigStore } from '@refly-packages/ai-workspace-common/stores/use-context-filter-config';
import { useProcessContextItems } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/copilot-operation-module/context-manager/hooks/use-process-context-items';
import { useProcessContextFilter } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/copilot-operation-module/context-manager/hooks/use-process-context-filter';
import { PiNotepad, PiTextAlignRightBold } from 'react-icons/pi';
import { HiOutlineBookOpen } from 'react-icons/hi2';
import { LuFileText } from 'react-icons/lu';
import { IconRefresh } from '@arco-design/web-react/icon';

import './index.scss';

const iconStyle = { fontSize: 10, transform: 'translateY(1px)', marginRight: 6, color: 'rgb(0, 0, 0, 0.6)' };

type ContextFilterPopoverContentProps = {
  handleVisibleChange?: (visible: boolean) => void;
};

interface FilterConfig {
  type: string[];
  contentListTypes: string[];
}

const defaultLimit = 16;
const defaultMaxLimit = 16;
const defaultTypeList = ['resources', 'notes', 'collections', 'contentList'];

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

const ContextFilterPopoverContent: React.FC<ContextFilterPopoverContentProps> = ({ handleVisibleChange }) => {
  const { t } = useTranslation();

  const {
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
  } = useProcessContextFilter();
  const [filters, setFilters] = useState<string[]>([]);
  const { contextItemTypes } = useProcessContextItems();

  const handleApply = () => {
    const applyCallback = filterApply(config, initialConfigRule);
    if (applyCallback) {
      applyCallback();
      return;
    }
    handleVisibleChange(false);
  };

  // get filter list
  useEffect(() => {
    const newFilters = [
      ...config?.type.filter((t) => t !== 'contentList'),
      ...(config?.type.includes('contentList') ? config?.contentListTypes : []),
    ];

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

          {config?.type.includes('contentList') && contentListConfig.length > 0 && (
            <div className="config-type">
              <div className="config-type__title">
                {t('knowledgeBase.context.contextFilter.contentListSelectedType')}
              </div>
              <div className="config-type__content">
                {contentListConfig.map((type) => (
                  <Checkbox
                    key={type}
                    className={`config-type__item ${!isMutiContentListType ? 'config-type__item-radio' : ''} `}
                    checked={config?.contentListTypes.includes(type)}
                    value={type}
                    onChange={() => updateConfig('contentListTypes', type, isMutiContentListType)}
                  >
                    {({ checked }) => {
                      return (
                        <div className={`custom-checkbox-card ${checked ? 'custom-checkbox-card-checked' : ''}`}>
                          <div className="custom-checkbox-card-mask">
                            <IconCheck className="custom-checkbox-card-mask-check" />
                          </div>
                          <Typography.Text ellipsis={{ showTooltip: true, rows: 1 }}>
                            {t(`knowledgeBase.context.${type}`)}
                          </Typography.Text>
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
              {t('knowledgeBase.context.contextFilter.result')}
              <IconArrowDown />
            </Divider>

            <div className="filter-preview-title">{t('knowledgeBase.context.contextFilter.filterConditions')}</div>
            <div className="filter-preview">
              {Object.keys(filteredContextItemTypes).length ? (
                Object.keys(filteredContextItemTypes).map((type) => (
                  <div key={type} className="filter-item">
                    {type === 'note' && <PiNotepad style={iconStyle} />}
                    {type === 'collection' && <HiOutlineBookOpen style={iconStyle} />}
                    {type === 'resource' && <LuFileText style={iconStyle} />}
                    {isContentList(type) && <PiTextAlignRightBold style={iconStyle} />}

                    <Typography.Text ellipsis={{ showTooltip: true, rows: 1 }}>
                      {t(`knowledgeBase.context.${type}`)}
                    </Typography.Text>
                    <div className="filter-item-limit">
                      <span
                        style={{
                          color: getConfigLimit(type, initialConfigRule) >= contextItemTypes[type] ? 'green' : 'red',
                        }}
                      >
                        {contextItemTypes[type]}{' '}
                      </span>
                      / {getConfigLimit(type, initialConfigRule)}
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

export const ContextFilter: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const useContextFilterConfig = useContextFilterConfigStore((state) => ({
    setUseConfigOfStore: state.setUseConfigOfStore,
  }));

  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible);
  };

  return (
    <Popover
      position="bottom"
      trigger="click"
      className="context-filter-popover"
      content={<ContextFilterPopoverContent handleVisibleChange={handleVisibleChange} />}
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
            useContextFilterConfig.setUseConfigOfStore(true);
          }}
        />
      </Tooltip>
    </Popover>
  );
};
