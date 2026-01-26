'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation, type Language } from '@/i18n';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const { language, setLanguage, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const languages: { code: Language; name: string; nativeName: string }[] = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
        { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSetLanguage = (langCode: Language) => {
        setLanguage(langCode);
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center h-11 w-11 rounded-full bg-background/70 text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                aria-label="Change language"
            >
                <Globe className="h-6 w-6" />
            </button>
            
            <div
                ref={dropdownRef}
                className={`absolute end-0 mt-2 w-48 origin-top-right rounded-xl bg-background/80 backdrop-blur-lg border border-secondary/20 shadow-2xl shadow-primary/10 ring-1 ring-black ring-opacity-5 z-10 transition-all duration-150 ease-out
                    ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
                <div className="p-1">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => handleSetLanguage(lang.code)}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                                language === lang.code 
                                ? 'bg-primary/20 text-primary font-semibold' 
                                : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                        >
                            <span>{lang.nativeName}</span>
                            <span className="text-xs opacity-70">{lang.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
