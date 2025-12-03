import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        return savedTheme;
      }
      return 'system';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
            root.classList.toggle('dark', e.matches);
            root.classList.toggle('light', !e.matches);
        }
    };
    
    if (theme === 'system') {
        root.classList.toggle('dark', mediaQuery.matches);
        root.classList.toggle('light', !mediaQuery.matches);
        mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
    
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};