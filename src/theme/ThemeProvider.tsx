import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, ThemeColors } from './colors';
import { usePreferences } from '@/prefs/PreferencesProvider';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightTheme,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { prefs } = usePreferences();

  const isDark = useMemo(() => {
    if (prefs.themeMode === 'dark') return true;
    if (prefs.themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [prefs.themeMode, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: isDark ? darkTheme : lightTheme, isDark }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
