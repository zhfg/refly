import { Button, Input, Space, Message as message, Divider } from '@arco-design/web-react';
import type { RefTextAreaType } from '@arco-design/web-react/es/Input/textarea';
import { IconSend } from '@arco-design/web-react/icon';
import React, { useEffect, useRef } from 'react';

// 自定义方法
import { getPopupContainer, scrollToBottom } from '@/utils/ui';

// 自定义组件
import WeblinkList from '../weblink-list';
import { ChatHeader } from './header';
import { SelectedWeblink } from '../selected-weblink/index';
import { QuickAction } from './quick-action';
import { ContentSelectorBtn } from '@/components/content-selector-btn/index';
// stores
import { useQuickActionStore } from '../../stores/quick-action';
import { useChatStore } from '../../stores/chat';
import { useMessageStateStore } from '@/stores/message-state';
import { useSiderStore } from '@refly/ai-workspace-common/stores/sider';
import { useWeblinkStore } from '@/stores/weblink';
import { SearchTarget, useSearchStateStore } from '@/stores/search-state';
import { useContentSelectorStore } from '@/stores/content-selector';
// hooks
import { useBuildThreadAndRun } from '@/hooks/use-build-thread-and-run';
import { useStoreWeblink } from '@/hooks/use-store-weblink';
// 组件
import { SearchTargetSelector } from './home-search-target-selector';
import { mapSourceFromWeblinkList } from '@/utils/weblink';
import { SelectedContentList } from '@/components/selected-content-list';
import { useSearchQuickActionStore } from '@/stores/search-quick-action';
import { useTranslation } from 'react-i18next';
import { CurrentWeblinkQuickSummary } from '@/components/current-weblink-quick-summary';
import { SaveKnowledgeBaseModal } from '@/components/save-knowledge-base-modal';
import { useKnowledgeBaseStore } from '@/stores/knowledge-base';
// styles
import './index.scss';

const TextArea = Input.TextArea;

type ChatProps = {};

// 用于快速选择
export const quickActionList = ['summary'];

const Home = (props: ChatProps) => {
  const inputRef = useRef<RefTextAreaType>();
  const weblinkListRef = useRef(null);

  // stores
  const quickActionStore = useQuickActionStore();
  const chatStore = useChatStore();
  const siderStore = useSiderStore();
  const webLinkStore = useWeblinkStore();
  const { searchTarget } = useSearchStateStore();
  const contentSelectorStore = useContentSelectorStore();
  const searchQuickActionStore = useSearchQuickActionStore();
  const searchStateStore = useSearchStateStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();

  const { t, i18n } = useTranslation();

  console.log('当前用户的语言', i18n.languages?.[0]);

  // hooks
  const { runTask } = useBuildThreadAndRun();
  const { uploadingStatus, handleUploadWebsite } = useStoreWeblink();
  const isIntentActive = !!quickActionStore.selectedText;

  const handleSendMessage = async () => {
    chatStore.setLoading(true);

    const { newQAText } = useChatStore.getState();
    const { searchTarget } = useSearchStateStore.getState();
    const { currentWeblink } = useWeblinkStore.getState();

    if (!newQAText) {
      message.info(t('loggedHomePage.homePage.status.emptyNotify'));
      return;
    }

    // 先存储 link， 在进行提问操作，这里理论上是需要有个 negotiate 的过程
    if (searchTarget === SearchTarget.CurrentPage) {
      const res = await handleUploadWebsite(window.location.href);
      if (!res?.success) {
        return;
      }
    }

    runTask();
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
        e.target.value = e.target.value.slice(0, cursorPos) + '\n' + e.target.value.slice(cursorPos);
        // 将光标移动到换行符后面
        e.target.selectionStart = e.target.selectionEnd = cursorPos + 1;
      }
    }

    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInputText = () => {
    const { showSelectedMarks } = useContentSelectorStore.getState();
    const { searchTarget } = useSearchStateStore.getState();

    if (showSelectedMarks) return t('loggedHomePage.homePage.searchPlaceholder.currentSelectedContent');
    if (searchTarget === SearchTarget.SelectedPages)
      return t('loggedHomePage.homePage.searchPlaceholder.selectedWeblink');
    if (searchTarget === SearchTarget.CurrentPage) return t('loggedHomePage.homePage.searchPlaceholder.current');
    if (searchTarget === SearchTarget.SearchEnhance) return t('loggedHomePage.homePage.searchPlaceholder.internet');
    if (searchTarget === SearchTarget.All) return t('loggedHomePage.homePage.searchPlaceholder.all');
  };

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && siderStore.showSider) inputRef?.current?.focus?.();
  }, [siderStore.showSider]);
  // 如果有展示意图，那么也需要滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [isIntentActive]);

  const getShowQuickAction = () => {
    if (searchTarget === SearchTarget.CurrentPage && searchQuickActionStore.showQuickAction) {
      return true;
    }

    if (
      (searchTarget === SearchTarget.SelectedPages && webLinkStore?.selectedRow?.length > 0) ||
      webLinkStore?.selectedRow?.length > 0
    ) {
      return true;
    }

    return false;
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ChatHeader />
      <div className="home-content-container input-panel">
        <div className="refly-slogan">{t('loggedHomePage.homePage.title')}</div>
        <div className="actions">
          {/* {messageStateStore.taskType === TASK_TYPE.CHAT &&
            messageStateStore?.pending && (
              <div className="stop-reponse">
                <Button
                  type="outline"
                  className="btn"
                  icon={<IconMinusCircle />}
                  onClick={buildShutdownTaskAndGenResponse}>
                  停止响应
                </Button>
              </div>
            )} */}
        </div>

        <div className="input-box">
          <TextArea
            ref={inputRef}
            className="message-input"
            autoFocus
            value={chatStore?.newQAText}
            onChange={(value) => {
              chatStore.setNewQAText(value);
            }}
            placeholder={getInputText()}
            onKeyDownCapture={(e) => handleKeyDown(e)}
            autoSize={{ minRows: 4, maxRows: 4 }}
            onCompositionStart={(e) => console.log('composition start')}
            onCompositionUpdate={(e) => console.log('composition update')}
            onCompositionEnd={(e) => console.log('composition end')}
            style={{
              borderRadius: 8,
              resize: 'none',
              minHeight: 98,
              height: 98,
            }}
          ></TextArea>
          <div>
            <div className="toolbar">
              <Space>
                <ContentSelectorBtn
                  handleChangeSelector={() => {
                    // 如果进行选中之后，则切换成选择当前网页，属于一种快捷方式
                    searchStateStore.setSearchTarget(SearchTarget.CurrentPage);
                  }}
                />
                <SearchTargetSelector
                  showText
                  handleChangeSelector={(searchTarget) => {
                    // 非当前网页时，则清空内容
                    if (searchTarget !== SearchTarget.CurrentPage) {
                      contentSelectorStore.resetState();
                    }

                    if ([SearchTarget.All, SearchTarget.SearchEnhance].includes(searchTarget)) {
                      searchQuickActionStore.setShowQuickAction(false);
                    }

                    if ([SearchTarget.CurrentPage].includes(searchTarget)) {
                      searchQuickActionStore.setShowQuickAction(true);
                    }
                  }}
                />
              </Space>
              <Button
                shape="circle"
                icon={<IconSend />}
                loading={chatStore.loading || uploadingStatus === 'loading'}
                style={{ color: '#FFF', background: '#00968F' }}
                onClick={() => handleSendMessage()}
              ></Button>
            </div>
          </div>
        </div>
        {webLinkStore?.selectedRow?.length > 0
          ? [
              <SelectedWeblink
                closable={true}
                selectedWeblinkList={mapSourceFromWeblinkList(webLinkStore?.selectedRow || []).map((item, index) => ({
                  key: webLinkStore?.selectedRow?.[index]?.key,
                  content: item,
                }))}
              />,
              <Divider />,
            ]
          : null}
        {getShowQuickAction() ? <QuickAction /> : null}
        {contentSelectorStore?.showSelectedMarks ? <SelectedContentList marks={contentSelectorStore.marks} /> : null}
        {/* <CurrentWeblinkQuickSummary /> */}
      </div>

      <WeblinkList ref={weblinkListRef} />
      {knowledgeBaseStore.isSaveKnowledgeBaseModalVisible ? <SaveKnowledgeBaseModal /> : null}
    </div>
  );
};

export default Home;
