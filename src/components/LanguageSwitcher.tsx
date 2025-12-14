import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '../translations';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'uk', name: 'Українська' },
    { code: 'es', name: 'Español' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode as 'en' | 'uk' | 'es');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
      >
        <Globe className="w-5 h-5 text-gray-600" />
        <span className="text-sm text-gray-700">
          {currentLanguage?.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 min-w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full px-4 py-2.5 text-sm text-left transition-colors whitespace-nowrap ${
                language === lang.code 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang.name}
              {language === lang.code && (
                <span className="ml-2">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
