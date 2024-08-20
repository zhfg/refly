// components
import { MultiSelect } from '@refly-packages/ai-workspace-common/components/skill/multi-select';
// store

import { SkillInvocationRule } from '@refly/openapi-schema';

import { Input, FormInstance } from '@arco-design/web-react';
import { TFunction } from 'i18next';

const TextArea = Input.TextArea;

export const InvokeOptionComponent = (props: {
  rule: SkillInvocationRule;
  form: FormInstance;
  t: TFunction;
}): React.ReactNode => {
  const { rule, form, t } = props;

  if (rule.key === 'query') {
    return <Input placeholder={t('skill.instanceInvokeModal.placeholder.query')} maxLength={100} showWordLimit />;
  }

  if (rule.key === 'resourceIds' || rule.key === 'noteIds' || rule.key === 'collectionIds') {
    return (
      <MultiSelect
        type={rule.key}
        placeholder={t(`skill.instanceInvokeModal.placeholder.${rule.key}`)}
        onValueChange={(val) => {
          form.setFieldValue(rule.key, val);
        }}
      />
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
