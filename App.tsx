import React, { useEffect, useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import AgentBrainApp from './components/agent-brain/AgentBrainApp';
import { Toaster } from 'sonner';
import { useTheme } from './context/ThemeContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { hexToHsl, getBrandForegroundColor } from './lib/utils';

const AppContent: React.FC = () => {
    const { theme } = useTheme();
    const { settings } = useSettings();
    const [toasterTheme, setToasterTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const getEffectiveTheme = () => {
            if (theme === 'system') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return theme;
        }

        setToasterTheme(getEffectiveTheme());

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => setToasterTheme(getEffectiveTheme());
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    useEffect(() => {
        const accentColor = settings.appearance.accentColor;
        const root = document.documentElement;
        if (accentColor) {
            const hsl = hexToHsl(accentColor);
            if (hsl) {
                root.style.setProperty('--brand-button', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
                const foregroundHsl = getBrandForegroundColor(accentColor);
                root.style.setProperty('--brand-button-foreground', foregroundHsl);
            }
        }
    }, [settings.appearance.accentColor]);
    
    return (
        <>
            <AgentBrainApp />
            <Toaster richColors theme={toasterTheme} />
        </>
    )
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <SettingsProvider>
            <LanguageProvider>
                <AppContent />
            </LanguageProvider>
        </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;