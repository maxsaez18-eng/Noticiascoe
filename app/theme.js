import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app-noticias:theme-mode';

export const lightColors = {
  bg: '#f0f2f5',
  surface: '#ffffff',
  surface2: '#f5f5f5',
  text: '#1a1a1a',
  text2: '#666',
  text3: '#999',
  border: '#e0e0e0',
  accent: '#1d9bf0',
  accentHover: '#1a8cd8',
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  cardShadow: 'rgba(0,0,0,0.06)',
  transBg: '#e8f5e9',
  transText: '#2e7d32',
};

export const darkColors = {
  bg: '#0d1117',
  surface: '#161b22',
  surface2: '#21262d',
  text: '#e6edf3',
  text2: '#8b949e',
  text3: '#6e7681',
  border: '#30363d',
  accent: '#58a6ff',
  accentHover: '#79b8ff',
  success: '#3fb950',
  danger: '#f85149',
  warning: '#d29922',
  cardShadow: 'rgba(0,0,0,0.3)',
  transBg: '#1b3a24',
  transText: '#7ee787',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('auto');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val) setMode(val);
    });
  }, []);

  const isDark = mode === 'auto' ? systemScheme === 'dark' : mode === 'dark';

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const setThemeMode = async (newMode) => {
    setMode(newMode);
    await AsyncStorage.setItem(THEME_KEY, newMode);
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, mode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
