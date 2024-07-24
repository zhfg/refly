import classNames from 'classnames';
import { Button, Input, Space } from '@arco-design/web-react';
import { useEffect, useRef, useState } from 'react';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';

// types
import { LOCALE } from '@refly/common-types';

// request
import { IconLanguage, IconSend } from '@arco-design/web-react/icon';
import { SearchTargetSelector } from '@refly-packages/ai-workspace-common/components/search-target-selector';
// styles
import './index.scss';
import { useSiderStore } from '@refly-packages/ai-workspace-common/stores/sider';
import { useQuickSearchStateStore } from '@refly-packages/ai-workspace-common/stores/quick-search-state';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { useTranslation } from 'react-i18next';
import { OutputLocaleList } from '../output-locale-list';
import { localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';

const TextArea = Input.TextArea;

export const SearchBox = () => {
  // refs
  const inputRef = useRef<RefTextAreaType>(null);
  // stores
  const chatStore = useChatStore();
  const siderStore = useSiderStore();
  const quickSearchStateStore = useQuickSearchStateStore();
  const searchTargetStore = useSearchStateStore();
  const userStore = useUserStore();
  const { emptyConvRunSkill } = useBuildThreadAndRun();
  // hooks
  const [isFocused, setIsFocused] = useState(false);

  const { t, i18n } = useTranslation();
  const uiLocale = i18n?.languages?.[0] as LOCALE;
  const outputLocale = userStore?.localSettings?.outputLocale;

  const handleSendMessage = () => {
    const question = chatStore?.newQAText || '';
    quickSearchStateStore.setVisible(false);
    emptyConvRunSkill(question, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.keyCode === 13 && (e.ctrlKey || e.shiftKey || e.metaKey)) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // 阻止默认行为,即不触发 enter 键的默认事件
        e.preventDefault();
        // 在输入框中插入换行符

        // 获取光标位置
        const cursorPos = e.target.selectionStart;
        // 在光标位置插入换行符
        e.target.value =
          e.target.value.slice(0, cursorPos as number) + '\n' + e.target.value.slice(cursorPos as number);
        // 将光标移动到换行符后面
        e.target.selectionStart = e.target.selectionEnd = (cursorPos as number) + 1;
      }
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleSendMessage();
    }

    if (e.keyCode === 75 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      quickSearchStateStore.setVisible(true);
    }
  };

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && siderStore.showSider) inputRef?.current?.focus?.();
  }, [siderStore.showSider]);
  useEffect(() => {
    searchTargetStore.setSearchTarget(SearchTarget.All);
  }, []);

  return (
    <div
      className={classNames('input-box-container', {
        'is-focused': isFocused,
      })}
    >
      <div
        className={classNames('search-box-container', {
          'search-box-container-active': isFocused,
        })}
      >
        <div
          className={classNames('input-box', {
            'is-focused': isFocused,
          })}
        >
          <TextArea
            ref={inputRef}
            className="message-input"
            autoFocus
            value={chatStore?.newQAText}
            onChange={(value) => {
              chatStore.setNewQAText(value);
            }}
            placeholder={t('loggedHomePage.homePage.searchPlaceholder')}
            onKeyDownCapture={(e) => handleKeyDown(e)}
            autoSize={{ minRows: 2, maxRows: 4 }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              borderRadius: 8,
              resize: 'none',
            }}
          ></TextArea>
          <div>
            <div className="toolbar">
              <Space>
                <SearchTargetSelector
                  classNames="search-assist-btn"
                  selectorList={[SearchTarget.All, SearchTarget.SearchEnhance]}
                />
                <OutputLocaleList>
                  <Button
                    type="text"
                    shape="round"
                    icon={<IconLanguage />}
                    className="setting-page-language-btn search-assist-btn"
                  >
                    {localeToLanguageName?.[uiLocale]?.[outputLocale]}{' '}
                  </Button>
                </OutputLocaleList>
              </Space>
              <Button
                shape="circle"
                icon={<IconSend />}
                className="search-btn"
                style={{ color: '#FFF', background: '#00968F' }}
                onClick={() => {
                  handleSendMessage();
                }}
              ></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
