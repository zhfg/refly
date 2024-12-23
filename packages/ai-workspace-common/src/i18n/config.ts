import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

export const initI18n = async () => {
  const i18next = (await import('i18next')).default;

  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      debug: process.env.NODE_ENV === 'development',
      defaultNS: 'ui',
      resources: {
        en: (await import('@refly/i18n/en-US')).default,
        'zh-CN': (await import('@refly/i18n/zh-Hans')).default,
        zh: (await import('@refly/i18n/zh-Hans')).default,
      },
      // if you see an error like: "Argument of type 'DefaultTFuncReturn' is not assignable to parameter of type xyz"
      // set returnNull to false (and also in the i18next.d.ts options)
      // returnNull: false,
    });
};
