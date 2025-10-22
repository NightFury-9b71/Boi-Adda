import { useLanguage } from '../contexts/LanguageContext';
import { bn, en } from '../translations';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const translations = language === 'bn' ? bn : en;
  
  const t = (path, params = {}) => {
    const keys = path.split('.');
    let result = translations;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        console.warn(`Translation key not found: ${path}`);
        return path; // Return the path if translation not found
      }
    }
    
    // Handle interpolation if result is a string and params are provided
    if (typeof result === 'string' && params && Object.keys(params).length > 0) {
      return result.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }
    
    return result;
  };

  return { t, language };
};