import React, { useState, useCallback, useEffect } from 'react';
import { Select, Input, SelectProps, InputProps, TextAreaProps } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { Mark, SelectedTextCardDomain } from '@refly/common-types';
import { SkillInvocationRule } from '@refly/openapi-schema';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { useGetCurrentSelectedMark } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-selected-text';

const { TextArea } = Input;

interface ContentListFormItemProps extends Omit<SelectProps, 'onChange'> {
  rule: SkillInvocationRule;
  onChange: (value: string) => void;
}

export const CONTENT_LIST_BREAK = '\n\n--refly-break--\n\n';

export const ContentListFormItem: React.FC<ContentListFormItemProps> = ({
  rule,
  onChange,
  className,
  style,
  placeholder,
  ...restProps
}) => {
  const { t } = useTranslation();
  const { finalUsedMarks = [] } = useGetCurrentSelectedMark();
  const [selectedDomains, setSelectedDomains] = useState<SelectedTextCardDomain[]>(
    (rule.defaultValue as SelectedTextCardDomain[]) || [],
  );
  const [content, setContent] = useState('');

  const isMultiSelect = rule.inputMode === 'multiSelect';
  const selectMode = isMultiSelect ? 'multiple' : undefined;

  const options = [
    'resource',
    'note',
    'extension-weblink',
    'noteCursorSelection',
    'noteBeforeCursorSelection',
    'noteAfterCursorSelection',
  ].map((domain) => ({
    label: t(`skill.instanceInvokeModal.context.contentList.${domain}`),
    value: domain,
  }));

  const handleSelectChange = useCallback(
    (value: SelectedTextCardDomain | SelectedTextCardDomain[]) => {
      const newSelectedDomains = Array.isArray(value) ? value : [value];
      setSelectedDomains(newSelectedDomains);
      onChange(content);
    },
    [content, onChange],
  );

  const handleTextAreaChange = useCallback(
    (value: string) => {
      setContent(value);
      onChange(value);
    },
    [selectedDomains, onChange],
  );

  const updateCurrentContent = (marks: Mark[], selectedDomains: SelectedTextCardDomain[]) => {
    const content = marks
      .filter((mark) => selectedDomains.includes(mark.namespace))
      .map((mark) => mark.data)
      .join(CONTENT_LIST_BREAK);
    setContent(content);
    onChange(content);
  };

  useEffect(() => {
    updateCurrentContent(finalUsedMarks, selectedDomains);
  }, [selectedDomains]);

  return (
    <>
      <Select
        {...restProps}
        className={`${className} content-list-select`}
        style={{ ...style, marginBottom: '8px' }}
        mode={selectMode}
        options={options}
        value={isMultiSelect ? selectedDomains : selectedDomains[0]}
        placeholder={placeholder || t('skill.instanceInvokeModal.placeholder.contentList.select')}
        onChange={handleSelectChange}
      />
      <TextArea
        {...(restProps as any as TextAreaProps)}
        className={`${className} content-list-textarea`}
        style={{ ...style, width: '100%' }}
        value={content}
        placeholder={t('skill.instanceInvokeModal.placeholder.contentList.textarea')}
        autoSize={{ minRows: 4, maxRows: 10 }}
        onChange={handleTextAreaChange}
      />
    </>
  );
};
