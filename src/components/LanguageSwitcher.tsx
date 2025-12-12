import { Globe } from 'lucide-react';
import { useTranslation } from '../translations';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="relative">
      <button
        onClick={() => setLanguage(language === 'en' ? 'uk' : 'en')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title={language === 'en' ? 'Switch to Ukrainian' : 'Перемкнути на англійську'}
      >
        <Globe className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {language === 'en' ? 'EN' : 'UA'}
        </span>
      </button>
    </div>
  );
}
