import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Divider } from '@arco-design/web-react';
import { Button } from 'antd';
import { IconDown, IconUser } from '@arco-design/web-react/icon';
import cn from 'classnames';

import { useTranslation } from 'react-i18next';

import './index.scss';

import { CopilotOperationModule } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { useChatStoreShallow } from '@refly-packages/ai-workspace-common/stores/chat';
import { UILocaleList } from '@refly-packages/ai-workspace-common/components/ui-locale-list';
import { GridPattern } from './grid-pattern';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

// types
import { MessageIntentSource } from '@refly-packages/ai-workspace-common/types/copilot';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { Canvas } from '@refly/openapi-schema';

const quickStartList = [
  {
    title: 'investment',
    emoji: '🗓️',
  },
  {
    title: 'productSearch',
    emoji: '🗓️',
  },
  {
    title: 'academicArticle',
    emoji: '📋',
  },
  {
    title: 'socialTweet',
    emoji: '📋',
  },
];

export const WriteGuide = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { setSubscribeModalVisible } = useSubscriptionStoreShallow((state) => ({
    setSubscribeModalVisible: state.setSubscribeModalVisible,
  }));
  const userStore = useUserStoreShallow((state) => ({
    userProfile: state.userProfile,
    setLoginModalVisible: state.setLoginModalVisible,
  }));

  const chatStore = useChatStoreShallow((state) => ({
    setNewQAText: state.setNewQAText,
  }));

  const footerList = [
    {
      title: 'terms',
      handleClick: () => {
        window.open(`/terms`, '_blank');
      },
    },
    {
      title: 'privacy',
      handleClick: () => {
        window.open(`/privacy`, '_blank');
      },
    },
    {
      title: 'contact',
      handleClick: () => {
        window.open(`https://twitter.com/tuturetom`, '_blank');
      },
    },
  ];

  if (userStore.userProfile) {
    footerList.unshift({
      title: 'pricing',
      handleClick: () => {
        setSubscribeModalVisible(true);
      },
    });
  }

  const [canvasList, setCanvasList] = useState<Canvas[]>([]);

  useEffect(() => {
    getClient()
      .listCanvases({})
      .then((res) => {
        const { data, error } = res;
        if (error) {
          return;
        }
        setCanvasList(data?.data || []);
      });
  }, []);

  return (
    <div className="write-guide-container">
      {!userStore.userProfile && (
        <Button
          type="primary"
          icon={<IconUser />}
          className="absolute right-3 top-3 px-4 py-2"
          onClick={() => userStore.setLoginModalVisible(true)}
        >
          {t('common.login')}
        </Button>
      )}

      <div className="write-guide">
        <div className="write-guide-inner">
          <div className="write-guide-header flex justify-between items-center">
            <div className="guide-text">{t('welcomeMessage')}</div>
          </div>

          <div className="ai-copilot">
            <CopilotOperationModule source={MessageIntentSource.HomePage} />
            <List
              grid={{
                sm: 48,
                md: 24,
                lg: 16,
                xl: 12,
              }}
              className="quick-start"
              wrapperStyle={{ width: '100%' }}
              bordered={false}
              pagination={false}
              dataSource={canvasList}
              render={(item, key) => (
                <List.Item key={key} className="quick-start-item-container" actionLayout="vertical">
                  <div
                    className="quick-start-item"
                    onClick={() => {
                      navigate(`/canvas/${item.canvasId}`);
                    }}
                  >
                    <div className="quick-start-item-emoji">🗓️</div>
                    <div className="quick-start-item-title">{item.title}</div>
                  </div>
                </List.Item>
              )}
            />
          </div>
          <Button
            type="primary"
            onClick={() => {
              getClient()
                .createCanvas({
                  body: {
                    title: `Canvas-${new Date().toISOString()}`,
                  },
                })
                .then((res) => {
                  const { data, error } = res;
                  if (error) {
                    return;
                  }
                  navigate(`/canvas/${data?.data?.canvasId}`);
                });
            }}
          >
            Create Canvas
          </Button>
        </div>
      </div>

      <div className="write-guide-footer">
        {footerList.map((item) => (
          <div className="write-guide-footer-item" key={item.title} onClick={item.handleClick}>
            {t(`homePage.footer.${item.title}`)}
            <Divider type="vertical" />
          </div>
        ))}
        <div className="write-guide-footer-item">
          <UILocaleList>
            {t('language')} <IconDown className="write-guide-footer-item-icon" />
          </UILocaleList>
        </div>
      </div>

      <GridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 -z-1',
        )}
      />
    </div>
  );
};
