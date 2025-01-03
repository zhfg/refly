import { Input } from 'antd';
import { memo, useRef, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useSearchStoreShallow } from '@refly-packages/ai-workspace-common/stores/search';
import type { SearchDomain, Skill } from '@refly/openapi-schema';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components/search-list';
import { useSkillStoreShallow } from '@refly-packages/ai-workspace-common/stores/skill';

const TextArea = Input.TextArea;

interface ChatInputProps {
  query: string;
  setQuery: (text: string) => void;
  selectedSkillName: string | null;
  handleSendMessage: () => void;
  handleSelectSkill?: (skill: Skill) => void;
}

const ChatInputComponent = ({
  query,
  setQuery,
  selectedSkillName,
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
          className="mb-0 bg-transparent outline-none box-border border-none resize-none focus:outline-none focus:shadow-none focus:border-none"
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
      <SearchList
        domain={'skill' as SearchDomain}
        placement="bottomLeft"
        trigger={[]}
        mode="single"
        handleConfirm={handleSearchListConfirm}
        open={showSkillSelector}
        setOpen={setShowSkillSelector}
      >
        {triggerElement}
      </SearchList>
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
