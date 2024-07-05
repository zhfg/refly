import { Button } from '@arco-design/web-react';
import { IconHistory } from '@arco-design/web-react/icon';
import { useEffect, useRef } from 'react';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { Helmet } from 'react-helmet';

// 自定义组件
import WeblinkList from '../weblink-list';
import { SelectedWeblink } from '../selected-weblink/index';
import { DigestArchive } from '@/pages/digest-timeline';
import { DigestToday } from '@/pages/digest-today';
import { SearchBox } from '@refly-packages/ai-workspace-common/components/search-box/';
// utils
// 自定义方法
// stores
import { useWeblinkStore } from '@refly-packages/ai-workspace-common/stores/weblink';
import { QuickAction } from './quick-action';
// scss
import './index.scss';
import { useCookie } from 'react-use';
// types
import { Weblink } from '@refly/openapi-schema';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
import { getExtensionId } from '@refly-packages/ai-workspace-common/utils/url';
import { useTranslation } from 'react-i18next';

// 用于快速选择
export const quickActionList = ['summary'];

const Home = () => {
  const weblinkListRef = useRef(null);
  const [token] = useCookie('_refly_ai_sid');

  const webLinkStore = useWeblinkStore();
  const userStore = useUserStore();

  // 基于 query 参数判断是 digest 还是归档，默认是归档
  const [searchParams] = useSearchParams();
  const isTimeline = searchParams.get('type');

  const { t } = useTranslation();

  const handleSendMsgToExtension = async (status: 'success' | 'failed', token?: string) => {
    try {
      await chrome.runtime.sendMessage(getExtensionId(), {
        name: 'refly-login-notify',
        body: {
          status,
          token,
        },
      });
    } catch (err) {
      console.log('handleSendMsgToExtension err', err);
    }

    console.log('dashboard close');
  };

  // const runQuickActionTask = async (payload: QUICK_ACTION_TASK_PAYLOAD) => {
  //   const task = buildQuickActionTask({
  //     question: `总结网页`,
  //     actionType: QUICK_ACTION_TYPE.SUMMARY,
  //     filter: payload?.filter,
  //     actionPrompt: "总结网页内容并提炼要点",
  //   })

  //   // 创建新会话并跳转
  //   handleCreateNewConversation(task)
  // }

  const mapSourceFromSelectedRow = (selectedRow: { content: Weblink; key: string | number }[]) => {
    return selectedRow?.map((item) => ({
      pageContent: item?.content?.originPageDescription || '',
      metadata: {
        source: item?.content?.originPageUrl || '',
        title: item?.content?.originPageTitle || '',
      },
      score: -1,
    }));
  };

  const handleScrollToMemory = () => {
    const elem = document.querySelector('.content-layout');
    elem?.scroll({
      behavior: 'smooth',
      top: elem?.scrollHeight,
    });
  };

  // TODO: 临时关闭，用于开发调试
  console.log('token', token);
  useEffect(() => {
    if (!(token || userStore?.userProfile?.uid)) return;

    const reflyLoginStatus = localStorage.getItem('refly-login-status');
    console.log('reflyLoginStatus', reflyLoginStatus, token);
    if ((token || userStore?.userProfile?.uid) && reflyLoginStatus) {
      // 从插件打开弹窗，给插件发消息
      handleSendMsgToExtension('success', token as string);
      localStorage.removeItem('refly-login-status');
      // localStorage.setItem(
      //   "refly-user-profile",
      //   safeStringifyJSON(userStore?.userProfile),
      // )
      setTimeout(() => {
        window.close();
      }, 500);
    }
  }, [token, userStore?.userProfile?.uid]);

  return (
    <div className="home-container" style={{}}>
      <Helmet>
        <title>
          {t('productName')} | {t('landingPage.slogan')}
        </title>
        <meta name="description" content={t('landingPage.description')} />
      </Helmet>
      <div className="home-search-container">
        <div className="footer input-panel home-search-inner-container">
          <div className="refly-slogan">{t('extension.loggedHomePage.homePage.title')}</div>
          <div className="actions"></div>

          <div>
            <SearchBox />
            <div className="search-assist-container">
              {/* <Button icon={<IconBulb />} className="search-assist-btn">
                换一批推荐
              </Button> */}
              <Button icon={<IconHistory />} className="search-assist-btn" onClick={handleScrollToMemory}>
                {t('extension.loggedHomePage.homePage.seeKnowledgeLibrary')}
              </Button>
            </div>
          </div>
          {webLinkStore?.selectedRow?.length > 0 ? (
            <SelectedWeblink
              closable={true}
              selectedWeblinkList={mapSourceFromSelectedRow(webLinkStore.selectedRow || [])}
            />
          ) : null}
          {webLinkStore?.selectedRow?.length > 0 ? <QuickAction /> : null}
        </div>
        <WeblinkList ref={weblinkListRef} />
      </div>
      {isTimeline ? <DigestArchive /> : <DigestToday />}
    </div>
  );
};

export default Home;
