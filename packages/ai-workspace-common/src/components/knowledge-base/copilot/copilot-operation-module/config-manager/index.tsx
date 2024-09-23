import { useEffect, useState } from 'react';
// 自定义样式
import './index.scss';

import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useMessageStateStore } from '@refly-packages/ai-workspace-common/stores/message-state';
import { SelectedInstanceCard } from '@refly-packages/ai-workspace-common/components/skill/selected-instance-card';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { Button, Checkbox, Radio, InputNumber, Input, Form, FormInstance, Select } from '@arco-design/web-react';
import { IconFile, IconRefresh } from '@arco-design/web-react/icon';
import { GrDocumentConfig } from 'react-icons/gr';
import { PiEyeSlash } from 'react-icons/pi';

import {
  DynamicConfigItem,
  DynamicConfigValue,
  SkillTemplateConfig,
  SkillTemplateConfigSchema,
  ConfigScope,
  SkillInstance,
} from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

const getFormField = (fieldPrefix: string, key: string) => {
  return `${fieldPrefix ? fieldPrefix + '.' : ''}${key}`;
};

const getDictValue = (dict: { [key: string]: string }, locale: string) => {
  return dict?.[locale] || dict?.en;
};

const ConfigItem = (props: {
  item: DynamicConfigItem;
  form: FormInstance;
  field: string;
  locale: string;
  configValue?: DynamicConfigValue;
}): React.ReactNode => {
  const { item, form, field, locale, configValue } = props;

  useEffect(() => {
    if (typeof item.defaultValue === 'string' || item?.defaultValue) {
      form.setFieldValue(field, {
        value: item.defaultValue,
        label: getDictValue(item.labelDict, locale),
        displayValue: String(item.defaultValue),
      });
    }
  }, [item?.defaultValue]);

  if (!item) {
    return null;
  }

  const label = getDictValue(item.labelDict, locale);
  const placeholder = getDictValue(item.descriptionDict, locale);

  const onValueChange = (val: any, displayValue: string) => {
    form.setFieldValue(field, {
      value: val,
      label,
      displayValue,
    } as DynamicConfigValue);
  };

  if (item.inputMode === 'input') {
    return (
      <Input
        placeholder={placeholder}
        defaultValue={(item?.defaultValue as string) || String(configValue?.value || '') || ''}
        onChange={(val) => {
          onValueChange(val, String(val));
        }}
      />
    );
  }

  if (item.inputMode === 'inputTextArea') {
    console.log(`item.defaultValue`, item.defaultValue, configValue?.value);
    return (
      <TextArea
        placeholder={placeholder}
        defaultValue={
          (typeof item?.defaultValue === 'string' ? item?.defaultValue : String(configValue?.value || '')) || ''
        }
        rows={4}
        autoSize={{
          minRows: 4,
          maxRows: 10,
        }}
        onChange={(val) => onValueChange(val, String(val))}
      />
    );
  }

  if (item.inputMode === 'inputNumber') {
    return (
      <InputNumber
        mode="button"
        defaultValue={(item?.defaultValue as number) || Number(configValue?.value) || 1}
        onChange={(val) => onValueChange(val, String(val))}
      />
    );
  }

  if (item.inputMode === 'select' || item.inputMode === 'multiSelect') {
    const optionValToDisplay = new Map(
      item.options.map((option) => [option.value, getDictValue(option.labelDict, locale)]),
    );

    return (
      <Select
        {...(item.inputMode === 'multiSelect' ? { mode: 'multiple' } : {})}
        options={item.options.map((option) => ({
          label: getDictValue(option.labelDict, locale),
          value: option.value,
        }))}
        defaultValue={configValue?.value || item?.defaultValue || (item.inputMode === 'multiSelect' ? [] : '')}
        placeholder={placeholder}
        onChange={(val) => {
          onValueChange(val, Array.isArray(val) ? val.join(',') : optionValToDisplay.get(val));
        }}
      />
    );
  }

  return null;
};

interface ConfigManagerProps {
  schema: SkillTemplateConfigSchema;
  form: FormInstance;
  tplConfig?: SkillTemplateConfig;
  fieldPrefix?: string;
  headerTitle?: string;
  headerIcon?: React.ReactNode;
  configScope?: 'runtime' | 'template';
  resetConfig?: () => void;
}

export const ConfigManager = (props: ConfigManagerProps) => {
  const { i18n, t } = useTranslation();
  const locale = i18n.languages?.[0] || 'en';

  const { schema, fieldPrefix, form, tplConfig, resetConfig } = props;
  const [activeConfig, setActiveConfig] = useState<DynamicConfigItem>();
  const [showConfig, setShowConfig] = useState<boolean>(false);

  useEffect(() => {
    if (tplConfig) {
      form.setFieldValue(fieldPrefix, tplConfig);
    } else {
      form.setFieldValue(fieldPrefix, {});
    }
  }, [tplConfig]);

  const handleConfigItemClick = (item: DynamicConfigItem) => {
    if (activeConfig?.key === item.key) {
      setActiveConfig(undefined);
      setShowConfig(false);
    } else {
      setActiveConfig(item);
      setShowConfig(true);
    }
  };

  return (
    <div className="config-manager">
      <div className="config-manager__items">
        <div className="config-manager__item">
          <GrDocumentConfig className="config-manager__item-icon" />
          技能配置
        </div>
        {(schema.items || []).map((item, index) => (
          <div
            key={item.key + index}
            className={`config-manager__item config-item ${activeConfig?.key === item.key ? 'active' : ''}`}
            onClick={() => {
              handleConfigItemClick(item);
            }}
          >
            <IconFile className="config-manager__item-icon" />
            <span style={{ color: '#000' }}>{getDictValue(item.labelDict, locale)}</span>
          </div>
        ))}
      </div>

      {showConfig && activeConfig && (
        <div className="config-manager__input">
          <div className="config-manager__input-top">
            <div>{getDictValue(activeConfig.labelDict, locale)}</div>
            <div>
              <Button
                icon={<IconRefresh />}
                onClick={() => {
                  console.log('reset', tplConfig);
                  resetConfig?.();
                }}
              >
                重置
              </Button>
              <Button
                icon={<PiEyeSlash />}
                onClick={() => {
                  setShowConfig(false);
                  setActiveConfig(undefined);
                }}
              >
                折叠
              </Button>
            </div>
          </div>

          <div className="config-manager__input-content">
            <ConfigItem
              item={activeConfig}
              form={form}
              field={getFormField(fieldPrefix, activeConfig.key)}
              locale={locale}
              configValue={tplConfig?.[activeConfig.key]}
            />
          </div>
        </div>
      )}
    </div>
  );
};
