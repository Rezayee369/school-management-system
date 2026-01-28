'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function SmartAssistant() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const quickActions = [
        "How do I create a user?",
        "How do I reset a password?",
        "How do I contact an admin?"
    ];

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
    
    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleQuickActionClick = (action: string) => {
        setInputValue(action);
        inputRef.current?.focus();
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        // Placeholder for future submission logic
        console.log("Sending message:", inputValue);
        setInputValue('');
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg active:scale-95 z-40 ${isOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
                aria-label="Open Smart Assistant"
            >
                <Sparkles className="h-8 w-8" />
            </button>

            {/* Chat Panel */}
            <div
                ref={panelRef}
                className={`fixed bottom-6 right-6 w-[calc(100%-3rem)] max-w-sm h-[70vh] max-h-[500px] bg-background/70 backdrop-blur-2xl border border-secondary/30 rounded-2xl shadow-2xl shadow-secondary/20 flex flex-col transition-all duration-300 ease-in-out z-50 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="assistant-title"
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 id="assistant-title" className="font-semibold text-foreground">
                            School Smart Assistant
                        </h2>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50"
                        aria-label="Close Smart Assistant"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                {/* Body */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {/* Welcome Message */}
                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                        <p>Welcome! I'm here to help you navigate the school portal. How can I assist you today?</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleQuickActionClick(action)}
                                className="w-full text-left p-3 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleFormSubmit} className="p-4 border-t border-border">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your question..."
                            className="w-full pl-4 pr-12 py-3 rounded-xl bg-background/50 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none border border-input"
                        />
                        <button
                            type="submit"
                            className="absolute inset-y-0 right-2 my-auto flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                            disabled={!inputValue.trim()}
                            aria-label="Send message"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
