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

export const HumanMessage = (props: { message: Partial<ChatMessage> }) => {
  const { message } = props;
  return (
    <div className="ai-copilot-message human-message-container">
      <div className="human-message">
        <Markdown content={message?.content as string} />
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
            <Skeleton animation></Skeleton>
          </>
        ) : (
          <Markdown content={message?.content as string} sources={sources} />
        )}
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
          <div className="welcome-message-skill-onboarding">
            <div className="skill-recommend-and-manage">
              <div className="manage-header">
                <p className="skill-recommend-title">新增 Skill 推荐</p>
                <Button className="manager-btn" type="text">
                  管理助手
                </Button>
              </div>
              <div className="skill-recommend-list">
                {skillTemplates.map((item, index) => (
                  <div className="skill-item" key={index}>
                    <div className="skill-item-header">
                      <div className="skill-profile">
                        <Avatar size={24} />
                        <span className="skill-name">{item?.displayName?.[localSettings.uiLocale] as string}</span>
                      </div>
                      <Button
                        className="skill-installer"
                        type="text"
                        onClick={() => {
                          handleAddSkillInstance(item?.name);
                        }}
                      >
                        添加
                      </Button>
                    </div>
                    <div className="skill-desc">{item?.description}</div>
                  </div>
                ))}
              </div>
            </div>
            {skillInstances?.length === 0 ? (
              <div className="install-skill-hint">
                <div className="install-skill-hint-container">
                  <p className="install-skill-hint-title">
                    你还未添加任何助手，<Button type="text">点我添加 -&gt;</Button>
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
