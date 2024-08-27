// components
import { SearchSelect } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';
// store

import { SkillInvocationRule } from '@refly/openapi-schema';

import { Input, FormInstance } from '@arco-design/web-react';
import { TFunction } from 'i18next';

const TextArea = Input.TextArea;

const ruleKeyToSearchDomain = {
  resourceIds: 'resource',
  noteIds: 'note',
  collectionIds: 'collection',
} as const;

export const InvokeOptionComponent = (props: {
  rule: SkillInvocationRule;
  form: FormInstance;
  t: TFunction;
  fieldMap?: Object;
}): React.ReactNode => {
  const { rule, form, t, fieldMap } = props;

  if (rule.key === 'query') {
    return <Input placeholder={t('skill.instanceInvokeModal.placeholder.query')} maxLength={100} showWordLimit />;
  }

  if (rule.key === 'resourceIds' || rule.key === 'noteIds' || rule.key === 'collectionIds') {
    return (
      <>
        <SearchSelect
          mode="multiple"
          domain={ruleKeyToSearchDomain[rule.key]}
          defaultValue={form.getFieldValue(fieldMap ? fieldMap[rule.key] : rule.key)}
          placeholder={t(`skill.instanceInvokeModal.placeholder.${rule.key}`)}
          onChange={(val) => {
            form.setFieldValue(fieldMap ? fieldMap[rule.key] : rule.key, val);
          }}
        />
      </>
    );
  }

  if (rule.key === 'contentList') {
    return (
      <TextArea
        placeholder={t('skill.instanceInvokeModal.placeholder.contentList')}
        rows={4}
        autoSize={{
          minRows: 4,
          maxRows: 10,
        }}
      />
    );
  }

  if (rule.key === 'urls') {
    return (
      <TextArea
        placeholder={t('skill.instanceInvokeModal.placeholder.urls')}
        rows={4}
        autoSize={{
          minRows: 4,
          maxRows: 10,
        }}
      />
    );
  }

  return null;
};
