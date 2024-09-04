import React, { useEffect, useState } from 'react';
import { Input, Form, FormInstance, InputNumber, Select } from '@arco-design/web-react';
import {
  DynamicConfigItem,
  DynamicConfigValue,
  SkillTemplateConfig,
  SkillTemplateConfigSchema,
} from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { FormHeader } from '@refly-packages/ai-workspace-common/components/skill/form-header';

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

  if (!item) {
    return null;
  }

  const label = getDictValue(item.labelDict, locale);
  const placeholder = getDictValue(item.descriptionDict, locale);

  if (item.inputMode === 'input') {
    return (
      <Input
        placeholder={placeholder}
        defaultValue={String(configValue?.value || '') || ''}
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

  if (item.inputMode === 'inputTextArea') {
    return (
      <TextArea
        placeholder={placeholder}
        defaultValue={String(configValue?.value)}
        rows={4}
        autoSize={{
          minRows: 4,
          maxRows: 10,
        }}
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
  headerTitle?: string;
}) => {
  const { i18n, t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const locale = i18n.languages?.[0] || 'en';

  const { schema, form, fieldPrefix = '', tplConfig, headerTitle } = props;
  const { items } = schema;

  if (!items?.length) {
    return null;
  }

  useEffect(() => {
    if (tplConfig) {
      Object.entries(tplConfig).forEach(([key, value]) => {
        const field = getFormField(fieldPrefix, key);
        console.log(`field`, field);
        form.setFieldValue(field, value);
      });
    }
  }, [form, tplConfig, fieldPrefix]);

  return (
    <div style={{ marginTop: 16 }}>
      <FormHeader title={headerTitle} enableCollapse collapsed={collapsed} onCollapseChange={setCollapsed} />
      {items?.length > 0 && !collapsed ? (
        <div className="template-config-form-items">
          {items.map((item, index) => {
            const field = getFormField(fieldPrefix, item.key);
            return (
              <FormItem
                layout="vertical"
                label={item.labelDict[locale]}
                key={item.key}
                required={item.required}
                field={field}
              >
                <ConfigItem
                  key={index}
                  item={item}
                  form={form}
                  field={field}
                  locale={locale}
                  configValue={tplConfig?.[item.key]}
                />
              </FormItem>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
