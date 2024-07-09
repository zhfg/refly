import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { ChatMessage } from '@refly/openapi-schema';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { Avatar, Button, Spin, Message, Dropdown, Menu, Skeleton } from '@arco-design/web-react';
import {
  IconBook,
  IconCaretDown,
  IconCheckCircle,
  IconCopy,
  IconEdit,
  IconImport,
  IconLoading,
  IconQuote,
  IconRight,
} from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
// 自定义组件
import { SourceList } from '@refly-packages/ai-workspace-common/components/source-list';
import { safeParseJSON } from '../../../utils/parse';
import { EditorOperation, editorEmitter } from '@refly-packages/ai-workspace-common/utils/event-emitter/editor';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { useSkillStore } from '@refly-packages/ai-workspace-common/stores/skill';
import { useSkillManagement } from '@refly-packages/ai-workspace-common/hooks/use-skill-management';
import { SkillManagement } from '@refly-packages/ai-workspace-common/components/skill/skill-management';

export const HumanMessage = (props: { message: Partial<ChatMessage>; profile: { avatar: string; name: string } }) => {
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
};

export const AssistantMessage = (props: {
  message: Partial<ChatMessage>;
  isPendingFirstToken: boolean;
  isPending: boolean;
  isLastSession: boolean;
  handleAskFollowing: (question?: string) => void;
}) => {
  const { message, isPendingFirstToken = false, isPending, isLastSession = false, handleAskFollowing } = props;
  const { t } = useTranslation();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const sources = typeof message?.sources === 'string' ? safeParseJSON(message?.sources) : message?.sources;
  const relatedQuestions =
    typeof message?.relatedQuestions === 'string'
      ? safeParseJSON(message?.relatedQuestions)
      : message?.relatedQuestions;

  const profile = { name: message?.skillMeta?.skillDisplayName, avatar: message?.skillMeta?.skillDisplayName };

  // TODO: 移入新组件

  const handleEditorOperation = (type: EditorOperation, content: string) => {
    // editorEmitter.emit('insertBlow', message?.content);

    if (type === 'insertBlow' || type === 'replaceSelection') {
      const editor = knowledgeBaseStore.editor;
      const selection = editor.view.state.selection;

      if (!editor) return;

      editor
        ?.chain()
        .focus()
        .insertContentAt(
          {
            from: selection.from,
            to: selection.to,
          },
          content,
        )
        .run();
    } else if (type === 'createNewNote') {
      editorEmitter.emit('createNewNote', content);
    }
  };

  const dropList = (
    <Menu
      className={'output-locale-list-menu'}
      onClickMenuItem={(key) => {
        const parsedText = message?.content?.replace(/\[citation]\(\d+\)/g, '');
        handleEditorOperation(key as EditorOperation, parsedText || '');
      }}
      style={{ width: 240 }}
    >
      <Menu.Item key="insertNote">
        <IconImport /> 插入笔记
      </Menu.Item>
      <Menu.Item key="insertNote">
        <IconCheckCircle /> 替换选中
      </Menu.Item>
      <Menu.Item key="createNewNote">
        <IconBook /> 创建新笔记
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="ai-copilot-message assistant-message-container">
      <div className="session-source">
        {(sources || [])?.length > 0 ? (
          <div className="session-title-icon">
            <IconQuote style={{ fontSize: 18, color: 'rgba(0, 0, 0, .5)' }} />
            <p>{t('threadDetail.item.session.source')}</p>
          </div>
        ) : null}
      </div>
      <SourceList isPendingFirstToken={isPendingFirstToken} sources={sources || []} isLastSession={isLastSession} />
      <div className="assistant-message">
        {isLastSession && (isPendingFirstToken || message?.content === '') ? (
          <>
            <>
              <div className="message-avatar">
                <Avatar size={32} style={{ backgroundColor: '#00d0b6' }}>
                  {/* <img src={profile?.avatar} /> */}
                  {profile?.avatar}
                </Avatar>
              </div>
              <div className="message-name-and-content">
                <span className="message-name">{profile?.name || 'pftom'}</span>
                <div className="assistant-message-content">
                  <Skeleton animation image={{ shape: 'circle' }} text={{ width: '90%' }}></Skeleton>
                </div>
              </div>
            </>
          </>
        ) : (
          <>
            <div className="message-avatar">
              <Avatar size={32} style={{ backgroundColor: '#00d0b6' }}>
                {/* <img src={profile?.avatar} /> */}
                {profile?.avatar}
              </Avatar>
            </div>
            <div className="message-name-and-content">
              <span className="message-name">{profile?.name || 'pftom'}</span>
              <div className="assistant-message-content">
                {isPending ? (
                  <div className="message-log-item" style={{ marginBottom: 4 }}>
                    <Spin size={12} />
                    <p className="message-log-content">技能运行中...</p>
                  </div>
                ) : null}
                {message?.logs?.length > 0 ? (
                  <div className="message-log-container">
                    {message?.logs?.map((log, index) => (
                      <div className="message-log-item" key={index}>
                        <IconCheckCircle style={{ fontSize: 12, color: 'green' }} />
                        <p className="message-log-content">{log}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Markdown content={message?.content as string} sources={sources} />
              </div>
              {(!isPending || !isLastSession) && (
                <div className="ai-copilot-answer-action-container">
                  <div className="session-answer-actionbar">
                    <div className="session-answer-actionbar-left">
                      <Button
                        type="text"
                        icon={<IconCopy style={{ fontSize: 14 }} />}
                        style={{ color: '#64645F' }}
                        className={'assist-action-item'}
                        onClick={() => {
                          const parsedText = message?.content?.replace(/\[citation]\(\d+\)/g, '');

                          copyToClipboard(parsedText || '');
                          Message.success('复制成功');
                        }}
                      >
                        复制
                      </Button>
                      <Dropdown droplist={dropList} position="bl">
                        <Button
                          type="text"
                          className={'assist-action-item'}
                          icon={<IconImport style={{ fontSize: 14 }} />}
                          style={{ color: '#64645F' }}
                          onClick={() => {
                            const parsedText = message?.content?.replace(/\[citation]\(\d+\)/g, '');
                            // editorEmitter.emit('insertBlow', message?.content || '');
                            handleEditorOperation('insertBlow', parsedText || '');
                          }}
                        >
                          插入笔记
                          <IconCaretDown />
                        </Button>
                      </Dropdown>
                    </div>
                    <div className="session-answer-actionbar-right"></div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {isLastSession && (relatedQuestions || []).length > 0 ? (
        <div className="ai-copilot-related-question-container">
          <div className="ai-copilot-related-question-list">
            {relatedQuestions?.map((item, index) => (
              <div className="ai-copilot-related-question-item" key={index} onClick={() => handleAskFollowing(item)}>
                <p className="ai-copilot-related-question-title">{item}</p>
                <IconRight style={{ color: 'rgba(0, 0, 0, 0.5)' }} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

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

  const guessQuestions = ['总结选中内容要点', '脑暴写作灵感', '写一篇 Twitter 原创文章'];

  return (
    <div className="ai-copilot-message welcome-message-container">
      <div className="welcome-message">
        <div className="welcome-message-user-container">
          <div className="user-container-avatar">
            <Avatar>
              <img src={userStore?.userProfile?.avatar || ''} />
            </Avatar>
          </div>
          <div className="user-container-title">Hello, {userStore?.userProfile?.name}</div>
        </div>
        <div className="welcome-message-text">How can I help you today?</div>
        {needInstallSkillInstance ? (
          <div className="skill-onboarding">
            {skillInstances?.length === 0 ? (
              <div className="install-skill-hint">
                <div className="install-skill-hint-container">
                  <p className="install-skill-hint-title">
                    你还未添加任何助手，
                    <Button
                      type="text"
                      onClick={() => {
                        skillStore.setSkillManagerModalVisible(true);
                      }}
                    >
                      点我添加 -&gt;
                    </Button>
                  </p>
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
