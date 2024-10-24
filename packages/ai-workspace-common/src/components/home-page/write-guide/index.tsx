import { List, Divider } from '@arco-design/web-react';
import { IconDown } from '@arco-design/web-react/icon';
import cn from 'classnames';

import { useTranslation } from 'react-i18next';

import './index.scss';

import { CopilotOperationModule } from '@refly-packages/ai-workspace-common/components/copilot/copilot-operation-module';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { getClientOrigin } from '@refly/utils/url';
import { UILocaleList } from '@refly-packages/ai-workspace-common/components/ui-locale-list';
import { GridPattern } from './grid-pattern';

const quickStartList = [
  {
    title: '写一篇投资 Memo',
    emoji: '🗓️',
  },
  {
    title: '撰写竞品调研',
    emoji: '🗓️',
  },
  {
    title: '写一篇关于 Scaling law 的学术文章',
    emoji: '📋',
  },
  {
    title: '基于 Founder mode 撰写社交推文',
    emoji: '📋',
  },
];

interface WriteGuideProps {
  isLogin: boolean;
}

export const WriteGuide = (props: WriteGuideProps) => {
  const { t } = useTranslation();
  const { setSubscribeModalVisible } = useSubscriptionStoreShallow((state) => ({
    setSubscribeModalVisible: state.setSubscribeModalVisible,
  }));

  const footerList = [
    {
      title: 'terms',
      handleClick: () => {
        window.open(`${getClientOrigin(true)}/terms`, '_blank');
      },
    },
    {
      title: 'privacy',
      handleClick: () => {
        window.open(`${getClientOrigin(true)}/privacy`, '_blank');
      },
    },
    {
      title: 'contact',
      handleClick: () => {
        window.open(`https://twitter.com/tuturetom`, '_blank');
      },
    },
  ];

  if (props.isLogin) {
    footerList.unshift({
      title: 'pricing',
      handleClick: () => {
        setSubscribeModalVisible(true);
      },
    });
  }

  return (
    <div className="write-guide-container">
      <div className="write-guide">
        <div className="write-guide-inner">
          <div className="write-guide-header">
            {/* <div className="recent">
            <div className="recent-button">New</div>
            Introducing Refly Enterprise and Team plans
            <IconRight style={{ fontSize: '12px', marginLeft: '8px', transform: 'translateY(1px)' }} />
          </div> */}
            <div className="guide-text">What Can I Help You Write?</div>
          </div>

          <div className="ai-copilot">
            <CopilotOperationModule source="homePage" />
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
              dataSource={quickStartList}
              render={(item, key) => (
                <List.Item key={key} className="quick-start-item-container" actionLayout="vertical">
                  <div className="quick-start-item">
                    <div className="quick-start-item-emoji">{item.emoji}</div>
                    <div className="quick-start-item-title">{item.title}</div>
                  </div>
                </List.Item>
              )}
            />
          </div>
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
