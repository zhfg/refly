import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { cnGuessQuestions, enGuessQuestions } from '@refly-packages/ai-workspace-common/utils/guess-question';
import { Avatar } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

// 自定义组件
import { KnowledgeKeywordList } from '../knowledge-keyword-list';
import { IconRight } from '@arco-design/web-react/icon';
// 样式
import './index.scss';

export const LeftAssistPanel = () => {
  const userStore = useUserStore();
  const { t, i18n } = useTranslation();

  const language = i18n.languages?.[0];
  const guessQuestions = language?.includes('en') ? enGuessQuestions : cnGuessQuestions;

  return (
    <div className="left-assist-panel-container">
      <div className="welcome-module">
        <div className="user">
          <Avatar>
            <img
              alt="avatar"
              src="//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
            />
          </Avatar>
          <p className="user-welcome-title">
            {t('workspace.leftPanel.welcomeTitle')} {userStore?.userProfile?.nickname}
          </p>
        </div>
        <div className="welcome-question">
          <p>{t('workspace.leftPanel.welcomeQuestion')}</p>
        </div>
        <div className="guess-question">
          <p className="guess-question-title">{t('workspace.leftPanel.guessTitle')}</p>
          <div className="guess-question-list">
            {guessQuestions.map((item, index) => {
              return (
                <div className="guess-question-item" key={index}>
                  <p>{item}</p>
                  <IconRight />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="keyword-module">
        <div className="keyword-title">
          <p>{t('workspace.leftPanel.keyword.title')}</p>
        </div>
        <div className="keyword-list">
          <KnowledgeKeywordList />
        </div>
        <div className="keyword-see-more">
          <p className="see-more-title">{t('workspace.leftPanel.keyword.seeMore')}</p>
          <IconRight />
        </div>
      </div>
    </div>
  );
};
