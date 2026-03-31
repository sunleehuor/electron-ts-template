import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/data/locales/en';
import zh from '@/data/locales/zh';
import { defaultI18nLanguage } from './i18n';

const i18n = i18next
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: en,
      },
      zh: {
        translation: zh,
      },
    },
    lng: defaultI18nLanguage,
    fallbackLng: defaultI18nLanguage,

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
