'use client';

import { useTranslation, type Language } from '@/i18n';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useTranslation();

    const languages: { code: Language, name: string }[] = [
        { code: 'en', name: 'EN' },
        { code: 'fa', name: 'FA' },
        { code: 'ps', name: 'PS' },
    ];

    return (
        <div className="flex items-center gap-2">
            {languages.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        language === lang.code
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'bg-background/70 text-foreground hover:bg-muted/50'
                    }`}
                >
                    {lang.name}
                </button>
            ))}
        </div>
    );
}
