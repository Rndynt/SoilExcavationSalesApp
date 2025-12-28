import * as React from 'react';
import type { LanguageCode } from '@/lib/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<LanguageCode>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('app-language');
        return (saved as LanguageCode) || 'id';
      }
    } catch (e) {
      console.error("Failed to load language from localStorage", e);
    }
    return 'id';
  });

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('app-language', language);
      }
    } catch (e) {
      console.error("Failed to save language to localStorage", e);
    }
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
