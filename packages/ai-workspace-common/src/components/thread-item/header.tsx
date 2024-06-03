import { Button, Message as message, Breadcrumb } from '@arco-design/web-react';
import { IconClockCircle, IconShareExternal } from '@arco-design/web-react/icon';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { time } from '@refly-packages/ai-workspace-common/utils/time';
import { ConversationListItem as Thread } from '@refly/openapi-schema';
import { LOCALE } from '@refly/constants';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  thread: Thread;
}

const BreadcrumbItem = Breadcrumb.Item;

export const Header = (props: HeaderProps) => {
  const { thread } = props;
  const { t, i18n } = useTranslation();

  const language = i18n.languages?.[0] as LOCALE;

  return (
    <header>
      <div>
        <Breadcrumb>
          <BreadcrumbItem href="/thread">{t('threadDetail.breadcrumb.threadLibrary')}</BreadcrumbItem>
          <BreadcrumbItem href={`/thread/${thread?.convId}`} className="breadcrum-description">
            {thread?.title}
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div className="funcs">
        {/* <Button type="text" icon={<IconMore />}></Button> */}
        <span key={2} style={{ display: 'inline-block', marginRight: 12 }}>
          <IconClockCircle style={{ fontSize: 14, color: '#64645F' }} />
          <span className="thread-library-list-item-text">{time(thread?.updatedAt, language).utc().fromNow()}</span>
        </span>
        <Button
          type="primary"
          icon={<IconShareExternal />}
          onClick={() => {
            copyToClipboard(location.href);
            message.success(t('threadDetail.item.copyNotify'));
          }}
          style={{ borderRadius: 4 }}
        >
          {t('threadDetail.item.share')}
        </Button>
      </div>
    </header>
  );
};
