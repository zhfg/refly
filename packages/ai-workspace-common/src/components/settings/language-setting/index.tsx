import { Button, Typography } from '@arco-design/web-react';

// styles
import './index.scss';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';
// components
import { UILocaleList } from '@refly-packages/ai-workspace-common/components/ui-locale-list';
import { IconDown } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { OutputLocaleList } from '../../output-locale-list';
import { LOCALE } from '@refly/common-types';
import { localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';

export const LanguageSetting = () => {
  const userStore = useUserStore();

  const { t, i18n } = useTranslation();
  const uiLocale = i18n?.languages?.[0] as LOCALE;
  const outputLocale = userStore?.localSettings?.outputLocale;

  return (
    <div className="language-setting">
      <div className="language-setting-content">
        <div className="language-setting-content-item">
          <Typography.Title heading={6}>{t('settings.language.uiLocale.title')}</Typography.Title>
          <UILocaleList width={600}>
            <Button className="setting-page-language-btn">
              {t('language')} <IconDown />
            </Button>
          </UILocaleList>
        </div>

        <div className="language-setting-content-item">
          <Typography.Title heading={6}>{t('settings.language.outputLocale.title')}</Typography.Title>
          <Typography.Paragraph type="secondary">
            {t('settings.language.outputLocale.description')}
          </Typography.Paragraph>
          <OutputLocaleList width={600} position="br">
            <Button className="setting-page-language-btn">
              {localeToLanguageName?.[uiLocale]?.[outputLocale]} <IconDown />
            </Button>
          </OutputLocaleList>
        </div>
      </div>
    </div>
  );
};
