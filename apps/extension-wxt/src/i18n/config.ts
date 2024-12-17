import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translation as enTranslation } from './en/translation';
import { translation as cnTranslation } from './cn/translation';

i18next.use(initReactI18next).init({
  debug: true,
  resources: {
    en: {
      translation: enTranslation,
    },
    'zh-CN': {
      translation: cnTranslation,
    },
  },
  // if you see an error like: "Argument of type 'DefaultTFuncReturn' is not assignable to parameter of type xyz"
  // set returnNull to false (and also in the i18next.d.ts options)
  // returnNull: false,
});
