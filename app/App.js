import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ThemeProvider, useTheme } from './theme';
import { initNotifications, startPolling } from './notifications';

import FeedScreen from './screens/FeedScreen';
import KeywordsScreen from './screens/KeywordsScreen';
import SourcesScreen from './screens/SourcesScreen';
import StatsScreen from './screens/StatsScreen';
import ErrorBoundary from './components/ErrorBoundary';

const Tab = createBottomTabNavigator();

const icons = {
  Feed: '⊙',
  Keywords: '#',
  Sources: '◎',
  Stats: '⚙',
};

function AppContent() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    initNotifications();
    startPolling();
  }, []);

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.accent,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: DefaultTheme.fonts,
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>{icons[route.name] || '?'}</Text>
          ),
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.text3,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 80 : 60,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        })}
      >
        <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: 'Feed' }} />
        <Tab.Screen name="Keywords" component={KeywordsScreen} options={{ tabBarLabel: 'Palabras' }} />
        <Tab.Screen name="Sources" component={SourcesScreen} options={{ tabBarLabel: 'Fuentes' }} />
        <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: 'Ajustes' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
