import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

const LanguageSwitcher = ({ className = "" }) => {
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleLanguage}
        className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-100 group"
        title={t('language.tooltip')}
      >
        <Languages className="h-5 w-5 mr-3 text-blue-600 group-hover:text-blue-700 transition-colors" />
        <div className="flex flex-col flex-1">
          <span className="font-medium text-sm">{t('language.switch')}</span>
          <span className="text-xs text-gray-500">
            {language === 'bn' ? t('language.bangla') : t('language.english')}
          </span>
        </div>
        <div className="ml-2 flex space-x-1">
          <span
            className={`px-2 py-1 text-xs rounded transition-colors ${
              language === 'bn'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            বাং
          </span>
          <span
            className={`px-2 py-1 text-xs rounded transition-colors ${
              language === 'en'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            EN
          </span>
        </div>
      </button>
    </div>
  );
};

export default LanguageSwitcher;