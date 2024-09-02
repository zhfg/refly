import React, { useEffect } from 'react';
import { Input, Form, FormInstance, InputNumber, Select } from '@arco-design/web-react';
import {
  DynamicConfigItem,
  DynamicConfigValue,
  SkillTemplateConfig,
  SkillTemplateConfigSchema,
} from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

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

  if (!item) {
    return null;
  }

  const label = getDictValue(item.labelDict, locale);
  const placeholder = getDictValue(item.descriptionDict, locale);

  if (item.inputMode === 'input') {
    return (
      <Input
        placeholder={placeholder}
        defaultValue={String(configValue?.value)}
        onChange={(val) =>
          form.setFieldValue(field, {
            value: val,
            label,
            displayValue: String(val),
          } as DynamicConfigValue)
        }
      />
    );
  }

  if (item.inputMode === 'inputNumber') {
    return (
      <InputNumber
        mode="button"
        defaultValue={String(configValue?.value)}
        onChange={(val) =>
          form.setFieldValue(field, {
            value: val,
            label,
            displayValue: String(val),
          } as DynamicConfigValue)
        }
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
        defaultValue={configValue?.value}
        placeholder={placeholder}
        onChange={(val) =>
          form.setFieldValue(field, {
            value: val,
            label,
            displayValue: Array.isArray(val)
              ? val.map((v) => optionValToDisplay.get(v)).join(',')
              : optionValToDisplay.get(val),
          } as DynamicConfigValue)
        }
      />
    );
  }

  return null;
};

export const TemplateConfigFormItems = (props: {
  schema: SkillTemplateConfigSchema;
  form: FormInstance;
  tplConfig?: SkillTemplateConfig;
  fieldPrefix?: string;
}) => {
  const { i18n } = useTranslation();
  const locale = i18n.languages?.[0] || 'en';

  const { schema, form, fieldPrefix = '', tplConfig } = props;
  const { items } = schema;

  useEffect(() => {
    if (tplConfig) {
      Object.entries(tplConfig).forEach(([key, value]) => {
        form.setFieldValue(getFormField(fieldPrefix, key), value);
      });
    }
  }, [form, tplConfig, fieldPrefix]);

  return (
    <div className="template-config-form-items">
      {items.map((item) => {
        const field = getFormField(fieldPrefix, item.key);
        return (
          <FormItem label={item.labelDict[locale]} key={item.key} required={item.required} field={field}>
            <ConfigItem item={item} form={form} field={field} locale={locale} configValue={tplConfig?.[item.key]} />
          </FormItem>
        );
      })}
    </div>
  );
};
