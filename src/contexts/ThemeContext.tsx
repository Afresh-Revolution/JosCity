import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Appearance = Theme | 'system';
interface ThemeContextType {
  theme: Theme;
  appearance: Appearance;
  setAppearance: (value: Appearance) => void;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
const THEME_DEFAULT_KEY = 'joscity.appearanceDefaultV2';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appearance, setAppearance] = useState<Appearance>(() => {
    const migrated = localStorage.getItem(THEME_DEFAULT_KEY);
    const saved = localStorage.getItem('theme');
    if (!migrated) {
      localStorage.setItem('theme', 'light');
      localStorage.setItem(THEME_DEFAULT_KEY, '1');
      return 'light';
    }
    return saved === 'dark' || saved === 'system' ? saved : 'light';
  });
  const [deviceDark, setDeviceDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDeviceDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const theme: Theme = appearance === 'system' ? (deviceDark ? 'dark' : 'light') : appearance;
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', appearance);
  }, [theme, appearance]);
  const toggleTheme = () => setAppearance(theme === 'light' ? 'dark' : 'light');
  return <ThemeContext.Provider value={{ theme, appearance, setAppearance, toggleTheme }}>{children}</ThemeContext.Provider>;
};
