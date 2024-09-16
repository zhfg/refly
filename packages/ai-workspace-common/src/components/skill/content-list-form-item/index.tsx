import React, { useState, useCallback, useEffect } from 'react';
import {
  Select,
  Input,
  SelectProps,
  InputProps,
  TextAreaProps,
  Collapse,
  Typography,
  Empty,
} from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { Mark, SelectedTextDomain, selectedTextDomains } from '@refly/common-types';
import { SkillContextContentItem, SkillContextValue, SkillInvocationRule } from '@refly/openapi-schema';
import { useContextPanelStore } from '@refly-packages/ai-workspace-common/stores/context-panel';
import { useSelectedMark } from '@refly-packages/ai-workspace-common/modules/content-selector/hooks/use-selected-mark';
import { useGetCurrentSelectedMark } from '@refly-packages/ai-workspace-common/components/knowledge-base/copilot/context-panel/hooks/use-get-current-selected-text';

const { TextArea } = Input;
const CollapseItem = Collapse.Item;

interface ContentListFormItemProps extends Omit<SelectProps, 'onChange'> {
  rule: SkillInvocationRule;
  onChange: (value: SkillContextValue) => void;
  locale: string;
}

export interface IContent extends SkillContextContentItem {
  metadata: { domain: SelectedTextDomain };
}

export const ContentListFormItem: React.FC<ContentListFormItemProps> = ({
  rule,
  onChange,
  className,
  style,
  placeholder,
  locale,
  ...restProps
}) => {
  const { t } = useTranslation();
  const { finalUsedMarks = [] } = useGetCurrentSelectedMark();
  const [selectedDomains, setSelectedDomains] = useState<SelectedTextDomain[]>(
    (rule.defaultValue as SelectedTextDomain[]) || [],
  );
  const [contentList, setContentList] = useState<IContent[]>([]);

  const isMultiSelect = rule.inputMode === 'multiSelect';
  const selectMode = isMultiSelect ? 'multiple' : undefined;

  const options: { label: string; value: SelectedTextDomain }[] = selectedTextDomains.map((domain) => ({
    label: t(`skill.instanceInvokeModal.context.contentList.${domain}`),
    value: domain,
  }));

  const handleSelectChange = useCallback(
    (value: SelectedTextDomain | SelectedTextDomain[], finalUsedMarks: Mark[] = []) => {
      const newSelectedDomains = Array.isArray(value) ? value : [value];
      setSelectedDomains(newSelectedDomains);

      updateCurrentContent(finalUsedMarks, newSelectedDomains);
    },
    [finalUsedMarks, onChange],
  );

  const handleTextAreaChange = useCallback(
    (index: number, value: string) => {
      const newContentList = contentList.map((item, idx) => {
        if (idx === index) {
          return { ...item, content: value };
        }
        return item;
      });
      setContentList(newContentList);
      onChange(newContentList);
    },
    [onChange, contentList],
  );

  const updateCurrentContent = (marks: Mark[], selectedDomains: SelectedTextDomain[]) => {
    const newContentList = marks
      .filter((mark) => selectedDomains.includes(mark.domain))
      .map((mark) => ({
        metadata: { domain: mark.domain },
        content: mark.data,
      }));

    setContentList(newContentList);
    onChange(newContentList);
  };

  useEffect(() => {
    updateCurrentContent(finalUsedMarks, selectedDomains);
  }, [finalUsedMarks?.length, selectedDomains?.length]);

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
        onChange={(val) => handleSelectChange(val, finalUsedMarks)}
      />

      {contentList?.length > 0 ? (
        <Collapse>
          {contentList.map((item, index) => (
            <CollapseItem
              name={`${item?.metadata?.domain}-${index}`}
              key={index}
              header={`${t(`skill.instanceInvokeModal.context.contentList.${item?.metadata?.domain}`)}-${index}`}
            >
              <TextArea
                {...(restProps as any as TextAreaProps)}
                className={`${className} content-list-textarea`}
                style={{ ...style, width: '100%' }}
                value={item?.content}
                placeholder={
                  rule?.descriptionDict?.[locale] || t('skill.instanceInvokeModal.placeholder.contentList.textarea')
                }
                autoSize={{ minRows: 4, maxRows: 10 }}
                onChange={(value) => handleTextAreaChange(index, value)}
              />
            </CollapseItem>
          ))}
        </Collapse>
      ) : (
        <Empty description={t('common.emptyInput')} />
      )}
    </>
  );
};
