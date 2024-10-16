import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { ChatMessage, Source } from '@refly/openapi-schema';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import {
  Avatar,
  Button,
  Spin,
  Message,
  Dropdown,
  Menu,
  Skeleton,
  Collapse,
  Divider,
  Typography,
} from '@arco-design/web-react';
import { IconBook, IconCaretDown, IconCheckCircle, IconCopy, IconImport, IconRight } from '@arco-design/web-react/icon';
import { MdOutlineToken } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
// 自定义组件
import { SkillAvatar } from '@refly-packages/ai-workspace-common/components/skill/skill-avatar';
import { SourceList } from '@refly-packages/ai-workspace-common/components/source-list';
import { safeParseJSON } from '../../../utils/parse';
import { EditorOperation, editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';
import { ClientChatMessage } from '@refly/common-types';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { memo } from 'react';
import classNames from 'classnames';
import { parseMarkdownWithCitations } from '@refly/utils/parse';
import { useState, useEffect } from 'react';
import { getRuntime } from '@refly-packages/ai-workspace-common/utils/env';

export const HumanMessage = memo(
  (props: { message: Partial<ChatMessage>; profile: { avatar: string; name: string }; disable?: boolean }) => {
    const { message, profile } = props;
    return (
      <div className="ai-copilot-message human-message-container">
        <div className="human-message">
          <div className="message-name-and-content">
            <span className="message-name">{profile?.name}</span>
            <div className="human-message-content">
              <Markdown content={message?.content as string} />
            </div>
          </div>
          <div className="message-avatar">
            <Avatar size={32}>
              <img src={profile?.avatar} />
            </Avatar>
          </div>
        </div>
      </div>
    );
  },
);

const CollapseItem = Collapse.Item;

export const AssistantMessage = memo(
  (props: {
    message: Partial<ClientChatMessage>;
    isPendingFirstToken: boolean;
    isPending: boolean;
    isLastSession: boolean;
    disable?: boolean;
    handleAskFollowing: (question?: string) => void;
  }) => {
    const {
      message,
      isPendingFirstToken = false,
      isPending,
      isLastSession = false,
      disable,
      handleAskFollowing,
    } = props;
    const runtime = getRuntime();
    const isWeb = runtime === 'web';

    const { t } = useTranslation();
    const noteStoreEditor = useNoteStore((state) => state.editor);
    let sources =
      typeof message?.structuredData?.['sources'] === 'string'
        ? safeParseJSON(message?.structuredData?.['sources'])
        : (message?.structuredData?.['sources'] as Source[]);
    let relatedQuestions =
      typeof message?.structuredData?.['relatedQuestions'] === 'string'
        ? safeParseJSON(message?.structuredData?.['relatedQuestions'])
        : (message?.structuredData?.['relatedQuestions'] as Array<string>);

    const profile = {
      name: message?.skillMeta?.displayName,
      avatar: message?.skillMeta?.displayName,
      icon: message?.skillMeta?.icon,
    };

    const handleEditorOperation = (type: EditorOperation, content: string) => {
      const parsedContent = parseMarkdownWithCitations(content, sources);

      if (type === 'insertBlow' || type === 'replaceSelection') {
        const editor = noteStoreEditor;

        if (!editor) return;

        const selection = editor.view?.state?.selection;

        if (selection) {
          editor
            .chain()
            .focus()
            .insertContentAt(
              {
                from: selection.from,
                to: selection.to,
              },
              parsedContent,
            )
            .run();
        }
      } else if (type === 'createNewNote') {
        editorEmitter.emit('createNewNote', parsedContent);
      }
    };

    const dropList = (
      <Menu
        className={'output-locale-list-menu'}
        onClickMenuItem={(key) => {
          const parsedText = parseMarkdownWithCitations(message?.content, sources);
          handleEditorOperation(key as EditorOperation, parsedText || '');
        }}
        style={{ width: 240 }}
      >
        <Menu.Item key="insertBlow">
          <IconImport /> {t('copilot.message.insertBlow')}
        </Menu.Item>
        <Menu.Item key="replaceSelection">
          <IconCheckCircle /> {t('copilot.message.replaceSelection')}
        </Menu.Item>
        <Menu.Item key="createNewNote">
          <IconBook /> {t('copilot.message.createNewNote')}
        </Menu.Item>
      </Menu>
    );

    const tokenUsageDropdownList = (
      <Menu>
        {message?.tokenUsage?.map((item, index) => (
          <Menu.Item key={'token-usage-' + index}>
            <div className="flex items-center">
              <span>
                {item?.modelName}:{' '}
                {t('copilot.tokenUsage', {
                  inputCount: item?.inputTokens,
                  outputCount: item?.outputTokens,
                })}
              </span>
            </div>
          </Menu.Item>
        ))}
      </Menu>
    );
    const [tokenUsage, setTokenUsage] = useState(0);

    useEffect(() => {
      let total = 0;
      (message?.tokenUsage || []).forEach((item) => {
        total += (item?.inputTokens || 0) + (item?.outputTokens || 0);
      });
      setTokenUsage(total);
    }, [message.tokenUsage]);

    return (
      <div className="ai-copilot-message assistant-message-container">
        <div className="assistant-message">
          <>
            <div className="message-avatar">
              <SkillAvatar
                icon={profile?.icon}
                size={32}
                shape="circle"
                displayName={profile?.name || t('copilot.reflyAssistant')}
              />
            </div>
            <div className="message-name-and-content">
              <span className="message-name">{profile?.name || t('copilot.reflyAssistant')}</span>
              <div className="assistant-message-content">
                <Collapse bordered={false} expandIconPosition="right">
                  <CollapseItem
                    className={classNames('message-log-collapse-container')}
                    header={
                      message?.pending ? (
                        <div className="message-log-collapse-header">
                          <Spin size={12} />
                          <p className="message-log-content">
                            <Typography.Ellipsis>
                              {message?.logs?.length > 0
                                ? message?.logs?.[message?.logs?.length - 1]
                                : t('copilot.message.skillRunning')}
                            </Typography.Ellipsis>
                          </p>
                        </div>
                      ) : (
                        <div className="message-log-collapse-header">
                          <IconCheckCircle style={{ fontSize: 12, color: 'green' }} />
                          <p className={classNames('message-log-content')}>
                            <Typography.Ellipsis>
                              {t('copilot.message.skillRunSuccess', {
                                count: message?.logs?.length || 0,
                              })}
                            </Typography.Ellipsis>
                          </p>
                        </div>
                      )
                    }
                    name="1"
                  >
                    {message?.logs?.length > 0 ? (
                      <div className="message-log-container">
                        {message?.logs?.map((log, index) => (
                          <div className="message-log-item" key={index}>
                            <IconCheckCircle style={{ fontSize: 12, color: 'green' }} />
                            <p className="message-log-content">
                              <Typography.Ellipsis>{log}</Typography.Ellipsis>
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CollapseItem>
                </Collapse>
                <div className="session-source">
                  {(sources || [])?.length > 0 ? (
                    <div className="session-title-icon">
                      <p>{t('threadDetail.item.session.source')}</p>
                    </div>
                  ) : null}
                  <SourceList
                    isPendingFirstToken={isPendingFirstToken}
                    sources={sources || []}
                    isLastSession={isLastSession}
                  />
                </div>
                {(sources || [])?.length > 0 ? (
                  <Divider
                    style={{
                      borderBottomStyle: 'dashed',
                      margin: '12px 0',
                    }}
                  />
                ) : null}
                {isLastSession && isPendingFirstToken ? (
                  <Skeleton animation text={{ width: '90%' }}></Skeleton>
                ) : (
                  <Markdown content={message?.content as string} sources={sources} />
                )}
                {(relatedQuestions || [])?.length > 0 ? (
                  <Divider
                    style={{
                      borderBottomStyle: 'dashed',
                      margin: '12px 0',
                    }}
                  />
                ) : null}
                {(relatedQuestions || []).length > 0 ? (
                  <div className="ai-copilot-related-question-container">
                    {(relatedQuestions || [])?.length > 0 ? (
                      <div className="session-title-icon">
                        <p>{t('copilot.message.relatedQuestion')}</p>
                      </div>
                    ) : null}
                    <div className="ai-copilot-related-question-list">
                      {relatedQuestions?.map((item, index) => (
                        <div
                          className="ai-copilot-related-question-item"
                          key={index}
                          onClick={() => handleAskFollowing(item)}
                        >
                          <p className="ai-copilot-related-question-title">{item}</p>
                          {/* <IconRight style={{ color: 'rgba(0, 0, 0, 0.5)' }} /> */}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="ai-copilot-answer-action-container">
                {tokenUsage > 0 ? (
                  <div className="ai-copilot-answer-token-usage">
                    <Dropdown droplist={tokenUsageDropdownList}>
                      <Button
                        type="text"
                        icon={<MdOutlineToken style={{ fontSize: 14, marginRight: 4 }} />}
                        className={'assist-action-item'}
                      >
                        {tokenUsage} Tokens
                      </Button>
                    </Dropdown>
                  </div>
                ) : null}
                {!disable && (!isPending || !isLastSession) && (
                  <div className="session-answer-actionbar">
                    <div className="session-answer-actionbar-left">
                      <Button
                        type="text"
                        icon={<IconCopy style={{ fontSize: 14 }} />}
                        style={{ color: '#64645F' }}
                        className={'assist-action-item'}
                        onClick={() => {
                          const parsedText = parseMarkdownWithCitations(message?.content, sources);
                          copyToClipboard(parsedText || '');
                          Message.success(t('copilot.message.copySuccess'));
                        }}
                      >
                        {t('copilot.message.copy')}
                      </Button>
                      {isWeb ? (
                        <Dropdown droplist={dropList} position="bl">
                          <Button
                            type="text"
                            className={'assist-action-item'}
                            icon={<IconImport style={{ fontSize: 14 }} />}
                            style={{ color: '#64645F' }}
                            onClick={() => {
                              const parsedText = parseMarkdownWithCitations(message?.content, sources);
                              handleEditorOperation('insertBlow', parsedText || '');
                            }}
                          >
                            {t('copilot.message.insertBlow')}
                            <IconCaretDown />
                          </Button>
                        </Dropdown>
                      ) : null}
                    </div>
                    <div className="session-answer-actionbar-right"></div>
                  </div>
                )}
              </div>
            </div>
          </>
        </div>
      </div>
    );
  },
);

export const PendingMessage = () => {
  return (
    <div className="ai-copilot-message assistant-message-container">
      <div className="assistant-message">
        <Spin dot size={4} />
      </div>
    </div>
  );
};

export const WelcomeMessage = () => {
  const userStore = useUserStore();
  const skillStore = useSkillStore();
  const { handleAddSkillInstance } = useSkillManagement();
  const { runSkill } = useBuildThreadAndRun();

  const { localSettings } = userStore;
  const { skillInstances = [], skillTemplates = [] } = skillStore;
  // const needInstallSkillInstance = skillInstances?.length === 0 && skillTemplates?.length > 0;
  const needInstallSkillInstance = true;

  const { t } = useTranslation();
  const guessQuestions = [
    t('copilot.message.summarySelectedContent'),
    t('copilot.message.brainstormIdeas'),
    t('copilot.message.writeTwitterArticle'),
  ];

  return (
    <div className="ai-copilot-message welcome-message-container">
      <div className="welcome-message">
        <div className="welcome-message-user-container">
          {userStore?.userProfile?.avatar ? (
            <div className="user-container-avatar" style={{ marginRight: 12 }}>
              <Avatar>
                <img src={userStore?.userProfile?.avatar || ''} />
              </Avatar>
            </div>
          ) : null}
          {userStore?.userProfile?.nickname ? (
            <div className="user-container-title">
              Hello{userStore?.userProfile?.nickname ? `, ${userStore?.userProfile?.nickname}` : ''}
            </div>
          ) : null}
        </div>
        <div className="welcome-message-text">How can I help you today?</div>
        {needInstallSkillInstance ? (
          <div className="skill-onboarding">
            {skillInstances?.length === 0 ? (
              <div className="install-skill-hint">
                <div className="install-skill-hint-container">
                  <div className="install-skill-hint-title">
                    {t('copilot.message.installSkillHint')}
                    <Button
                      type="text"
                      onClick={() => {
                        skillStore.setSkillManagerModalVisible(true);
                      }}
                    >
                      {t('copilot.message.installSkillHintTitle')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="welcome-message-guess-you-ask-container ai-copilot-related-question-container">
            <div className="guess-you-ask-assist"></div>
            <div className="guess-you-ask ai-copilot-related-question-lis">
              {guessQuestions?.map((item, index) => (
                <div className="ai-copilot-related-question-item" key={index} onClick={() => runSkill(item)}>
                  <p className="ai-copilot-related-question-title">{item}</p>
                  <IconRight style={{ color: 'rgba(0, 0, 0, 0.5)' }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
