import { useAppContext } from './useAnalysisState';
import { translations, Language } from '../i18n/translations';

export const useTranslation = () => {
  const { language } = useAppContext();

  const t = (key: string): string => {
    // Cast language to Language type, fallback to 'en'
    const lang = (translations[language as Language] ? language : 'en') as Language;
    
    // Return translation if exists, otherwise fallback to english, then key
    return translations[lang][key] || translations['en'][key] || key;
  };

  return { t, language };
};
