import React, { useState } from 'react';
import { Input, Form, FormInstance, Radio } from '@arco-design/web-react';
import { TFunction } from 'i18next';
import { SearchSelect } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
import { SkillInvocationRule, SkillInvocationRuleGroup } from '@refly/openapi-schema';
import { FormHeader } from '@refly-packages/ai-workspace-common/components/skill/form-header';

import './index.scss';
import { ContentListFormItem } from '@refly-packages/ai-workspace-common/components/skill/content-list-form-item';

const FormItem = Form.Item;
const TextArea = Input.TextArea;
const RadioGroup = Radio.Group;

const ruleKeyToSearchDomain = {
  resourceIds: 'resource',
  noteIds: 'note',
  collectionIds: 'collection',
} as const;

const getFormField = (fieldPrefix: string, key: string) => {
  return `${fieldPrefix ? fieldPrefix + '.' : ''}${key}`;
};

const InvokeOption = (props: {
  rule: SkillInvocationRule;
  t: TFunction;
  onChange: (val: any) => void;
  disabled?: boolean;
}): React.ReactNode => {
  const { rule, t, disabled, onChange } = props;

  const commonProps = {
    disabled,
    className: 'invocation-form__input',
  };

  if (rule.key === 'query') {
    return (
      <Input
        {...commonProps}
        placeholder={t('skill.instanceInvokeModal.placeholder.query')}
        maxLength={100}
        showWordLimit
        onChange={onChange}
      />
    );
  }

  if (rule.key === 'resourceIds' || rule.key === 'noteIds' || rule.key === 'collectionIds') {
    return (
      <SearchSelect
        {...commonProps}
        {...(rule.limit > 1 ? { mode: 'multiple' } : {})}
        domain={ruleKeyToSearchDomain[rule.key]}
        placeholder={t(`skill.instanceInvokeModal.placeholder.${rule.key}`)}
        onChange={(val) => {
          if (!Array.isArray(val)) {
            onChange([val]);
          } else {
            onChange(val);
          }
        }}
      />
    );
  }

  if (rule.key === 'contentList') {
    return (
      <ContentListFormItem
        {...commonProps}
        rule={rule}
        onChange={(value) => {
          onChange(value);
        }}
      />
    );
  }

  if (rule.key === 'urls') {
    return (
      <TextArea
        {...commonProps}
        className={`${commonProps.className} invocation-form__input--textarea`}
        placeholder={t(`skill.instanceInvokeModal.placeholder.${rule.key}`)}
        rows={4}
        autoSize={{
          minRows: 4,
          maxRows: 10,
        }}
        onChange={onChange}
      />
    );
  }

  return null;
};

interface InvokeOptionGroupProps {
  ruleGroup: SkillInvocationRuleGroup;
  form: FormInstance;
  t: TFunction;
  fieldPrefix?: string;
  headerTitle?: string;
  selectTooltipTitle?: string;
}

export const InvocationFormItems = (props: InvokeOptionGroupProps) => {
  const { ruleGroup, form, t, fieldPrefix, headerTitle, selectTooltipTitle } = props;
  const { rules, relation } = ruleGroup;
  const resourceOptions = rules.map((rule) => ({
    label: t(`skill.instanceInvokeModal.formLabel.${rule.key}`),
    value: rule.key,
  }));
  const [collapsed, setCollapsed] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string | string[]>(resourceOptions?.[0]?.value);

  if (!ruleGroup) return null;
  if (rules.length === 0) return null;

  const [selectedKey, setSelectedKey] = useState<string | null>(rules[0].key);
  const [ruleValues, setRuleValues] = useState<Record<string, string>>({});

  const selectedRule = rules.find((rule) => rule.key === selectedResource);
  // console.log('rules', rules, selectedRule, relation, collapsed);

  if (relation === 'mutuallyExclusive') {
    return (
      <>
        <FormHeader
          title={headerTitle}
          options={resourceOptions}
          enableSelect
          enableCollapse
          selectTooltipTitle={selectTooltipTitle}
          collapsed={collapsed}
          onSelectChange={(value: string) => {
            setSelectedResource(value);
            setSelectedKey(value);
            console.log(`onSelectChange`, value);
            rules.forEach((rule) => {
              const field = getFormField(fieldPrefix, rule.key);
              if (rule.key !== value) {
                // clear the value of the unselected item
                form.setFieldValue(field, undefined);
              } else {
                // restore the value of the selected item
                form.setFieldValue(field, ruleValues[rule.key]);
              }
            });
          }}
          onCollapseChange={setCollapsed}
        />
        {!collapsed && (
          <div className="invocation-form">
            <FormItem
              label={t(`skill.instanceInvokeModal.formLabel.${selectedRule.key}`)}
              key={selectedRule.key}
              required={selectedRule.required}
              rules={[
                {
                  validator(value, cb) {
                    if (!value && selectedRule?.required) {
                      return cb(t('common.emptyInput'));
                    }

                    return cb();
                  },
                },
              ]}
              field={getFormField(fieldPrefix, selectedRule.key)}
            >
              <div style={{ opacity: selectedKey === selectedRule.key ? 1 : 0.5 }}>
                <InvokeOption
                  rule={selectedRule}
                  t={t}
                  disabled={selectedKey !== selectedRule.key}
                  onChange={(val) => {
                    const field = getFormField(fieldPrefix, selectedRule.key);
                    setRuleValues({ ...ruleValues, [field]: val });
                    form.setFieldValue(field, val);
                  }}
                />
              </div>
            </FormItem>
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <FormHeader
        title={headerTitle}
        options={resourceOptions}
        enableCollapse
        collapsed={collapsed}
        onSelectChange={setSelectedResource}
        onCollapseChange={setCollapsed}
      />
      {!collapsed && (
        <>
          {rules.map((rule) => (
            <FormItem
              layout="vertical"
              label={t(`skill.instanceInvokeModal.formLabel.${rule.key}`)}
              key={rule.key}
              required={rule.required}
              rules={[
                {
                  validator(value, cb) {
                    if (!value && rule?.required) {
                      return cb(t('common.emptyInput'));
                    }

                    return cb();
                  },
                },
              ]}
              field={getFormField(fieldPrefix, rule.key)}
            >
              <InvokeOption
                rule={rule}
                t={t}
                disabled={selectedKey !== rule.key}
                onChange={(val) => {
                  form.setFieldValue(getFormField(fieldPrefix, rule.key), val);
                }}
              />
            </FormItem>
          ))}
        </>
      )}
    </div>
  );
};
