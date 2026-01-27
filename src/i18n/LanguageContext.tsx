'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import en from './locales/en.json';
import fa from './locales/fa.json';
import ps from './locales/ps.json';

export type Language = 'en' | 'fa' | 'ps';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = { en, fa, ps };
const defaultLanguage: Language = 'fa';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('app-lang') as Language;
    if (storedLang && ['en', 'fa', 'ps'].includes(storedLang)) {
      setLanguageState(storedLang);
      document.documentElement.lang = storedLang;
      document.documentElement.dir = ['fa', 'ps'].includes(storedLang) ? 'rtl' : 'ltr';
    } else {
        document.documentElement.lang = defaultLanguage;
        document.documentElement.dir = ['fa', 'ps'].includes(defaultLanguage) ? 'rtl' : 'ltr';
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = ['fa', 'ps'].includes(lang) ? 'rtl' : 'ltr';
  };
  
  const t = (key: string, replacements?: Record<string, string>): string => {
    // On server or before mount, use default language to prevent mismatch.
    const effectiveLanguage = isMounted ? language : defaultLanguage;
    const keys = key.split('.');
    let result: any = translations[effectiveLanguage];

    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
            console.warn(`Translation key not found: ${key}`);
            return key; // Return the key itself as a fallback
        }
    }
    
    if (typeof result === 'string' && replacements) {
        return Object.entries(replacements).reduce((acc, [placeholder, value]) => {
            return acc.replace(new RegExp(`{{${placeholder}}}`, 'g'), value);
        }, result);
    }

    return result || key;
  };


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
