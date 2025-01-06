import { AutoComplete, AutoCompleteProps, Input } from 'antd';
import { memo, useRef, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import type { SearchDomain, Skill } from '@refly/openapi-schema';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components/search-list';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';
import { cn } from '@refly-packages/utils/cn';
import { useListSkills } from '@refly-packages/ai-workspace-common/queries/queries';

const TextArea = Input.TextArea;

interface ChatInputProps {
  query: string;
  setQuery: (text: string) => void;
  selectedSkillName: string | null;
  inputClassName?: string;
  handleSendMessage: () => void;
  handleSelectSkill?: (skill: Skill) => void;
}

const ChatInputComponent = ({
  query,
  setQuery,
  selectedSkillName,
  inputClassName,
  handleSendMessage,
  handleSelectSkill,
}: ChatInputProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<RefTextAreaType>(null);
  const searchStore = useSearchStoreShallow((state) => ({
    setIsSearchOpen: state.setIsSearchOpen,
  }));
  const { setSelectedSkill, setSkillManagerModalVisible } = useSkillStoreShallow((state) => ({
    setSelectedSkill: state.setSelectedSkill,
    setSkillManagerModalVisible: state.setSkillManagerModalVisible,
  }));
  const [showSkillSelector, setShowSkillSelector] = useState(false);

  const { data } = useListSkills({}, null, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const skills = data?.data ?? [];

  const [options, setOptions] = useState<AutoCompleteProps['options']>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '/' && !query) {
      setShowSkillSelector(true);
      return;
    } else {
      showSkillSelector && setShowSkillSelector(false);
    }

    if (!query?.trim()) {
      if (e.keyCode === 13) {
        e.preventDefault();
        return;
      }
      return;
    }

    const preventEmptyLine = () => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        const cursorPos = e.target.selectionStart ?? 0;
        const text = query;

        let currentLineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
        if (currentLineStart === -1) currentLineStart = 0;
        const currentLineEnd = text.indexOf('\n', cursorPos);
        const currentLine = text.slice(currentLineStart, currentLineEnd === -1 ? text.length : currentLineEnd);

        if (!currentLine.trim()) {
          e.preventDefault();
          return;
        }

        e.preventDefault();
        const newValue = text.slice(0, cursorPos) + '\n' + text.slice(cursorPos);
        setQuery(newValue);

        setTimeout(() => {
          if (e.target instanceof HTMLTextAreaElement) {
            e.target.selectionStart = e.target.selectionEnd = cursorPos + 1;
          }
        }, 0);
      }
    };

    if (e.keyCode === 13) {
      if (e.ctrlKey || e.shiftKey || e.metaKey) {
        preventEmptyLine();
      } else {
        e.preventDefault();
        if (query?.trim()) {
          handleSendMessage();
        }
      }
    }

    if (e.keyCode === 75 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      searchStore.setIsSearchOpen(true);
    }
  };

  const handleSearch = useCallback(
    (value: string) => {
      if (value.startsWith('/')) {
        setOptions(
          skills.map((skill) => ({
            value: skill.name,
            label: t(`${skill.name}.name`, { ns: 'skill' }),
          })),
        );
      } else {
        setOptions([]);
      }
    },
    [skills],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setQuery(value);
    },
    [setQuery],
  );

  const triggerElement = useMemo(() => {
    return (
      <div className="relative w-full">
        <TextArea
          ref={inputRef}
          autoFocus
          onBlur={() => {
            setTimeout(() => {
              setShowSkillSelector(false);
            }, 100);
          }}
          value={query ?? ''}
          onChange={handleInputChange}
          onKeyDownCapture={(e) => handleKeyDown(e)}
          className={cn(
            'mb-0 bg-transparent outline-none box-border border-none resize-none focus:outline-none focus:shadow-none focus:border-none',
            inputClassName,
          )}
          placeholder={
            selectedSkillName
              ? t(`${selectedSkillName}.placeholder`, {
                  ns: 'skill',
                  defaultValue: t(`commonQnA.placeholder`, { ns: 'skill' }),
                })
              : t(`commonQnA.placeholder`, { ns: 'skill' })
          }
          autoSize={{
            minRows: 1,
            maxRows: 6,
          }}
        />
      </div>
    );
  }, [query, selectedSkillName, handleKeyDown, t]);

  const handleSearchListConfirm = useCallback(
    (items: any[]) => {
      if (handleSelectSkill) {
        handleSelectSkill(items[0].metadata?.originalItem as Skill);
      } else {
        setQuery('');
        setSelectedSkill(items[0].metadata?.originalItem as Skill);
      }
    },
    [setSelectedSkill, handleSelectSkill],
  );

  return (
    <div className="w-full flex flex-col">
      <AutoComplete
        options={options}
        popupMatchSelectWidth={false}
        value={query ?? ''}
        onSelect={(value, option) => {
          console.log('onSelect', value, option);
        }}
        onSearch={(value) => handleSearch(value)}
      >
        <TextArea
          ref={inputRef}
          autoFocus
          onBlur={() => {
            setTimeout(() => {
              setShowSkillSelector(false);
            }, 100);
          }}
          value={query ?? ''}
          onChange={handleInputChange}
          onKeyDownCapture={(e) => handleKeyDown(e)}
          className={cn(
            'mb-0 bg-transparent outline-none box-border border-none resize-none focus:outline-none focus:shadow-none focus:border-none',
            inputClassName,
          )}
          placeholder={
            selectedSkillName
              ? t(`${selectedSkillName}.placeholder`, {
                  ns: 'skill',
                  defaultValue: t(`commonQnA.placeholder`, { ns: 'skill' }),
                })
              : t(`commonQnA.placeholder`, { ns: 'skill' })
          }
          autoSize={{
            minRows: 1,
            maxRows: 6,
          }}
        />
      </AutoComplete>
    </div>
  );
};

export const ChatInput = memo(ChatInputComponent, (prevProps, nextProps) => {
  return (
    prevProps.query === nextProps.query &&
    prevProps.selectedSkillName === nextProps.selectedSkillName &&
    prevProps.handleSelectSkill === nextProps.handleSelectSkill
  );
});

ChatInput.displayName = 'ChatInput';
