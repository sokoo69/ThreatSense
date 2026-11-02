import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './en.json';
import bnTranslations from './bn.json';

const defaultLanguage =
  typeof window !== 'undefined'
    ? localStorage.getItem('threatsense_lang') || 'en'
    : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    bn: { translation: bnTranslations },
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already safeguards against XSS
  },
});

export const changeLanguage = (lng: 'en' | 'bn') => {
  i18n.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem('threatsense_lang', lng);
  }
};

export default i18n;
