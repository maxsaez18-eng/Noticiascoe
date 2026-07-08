import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ThemeProvider, useTheme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setCachedToken } from './api';
import { initNotifications, startPolling } from './notifications';

import FeedScreen from './screens/FeedScreen';
import KeywordsScreen from './screens/KeywordsScreen';
import SourcesScreen from './screens/SourcesScreen';
import StatsScreen from './screens/StatsScreen';
import UsersScreen from './screens/UsersScreen';
import LoginScreen from './screens/LoginScreen';
import ErrorBoundary from './components/ErrorBoundary';

const Tab = createBottomTabNavigator();

const icons = {
  Feed: 'newspaper-outline',
  Keywords: 'pricetags-outline',
  Sources: 'rss-outline',
  Stats: 'settings-outline',
  Users: 'people-outline',
};

function AppContent() {
  const { colors, isDark } = useTheme();
  const { user, loading, token, isAdmin } = useAuth();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (token) setCachedToken(token);
    if (!loading) {
      initNotifications();
      startPolling();
    }
  }, [loading, token]);

  const content = loading ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  ) : !user ? (
    <LoginScreen />
  ) : (
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
            <Ionicons name={icons[route.name] || 'help-outline'} size={size} color={color} />
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
            maxWidth: isWeb ? 680 : undefined,
            alignSelf: isWeb ? 'center' : undefined,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        })}
      >
        <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: 'Feed' }} />
        <Tab.Screen name="Keywords" component={KeywordsScreen} options={{ tabBarLabel: 'Palabras' }} />
        <Tab.Screen name="Sources" component={SourcesScreen} options={{ tabBarLabel: 'Fuentes' }} />
        <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: 'Ajustes' }} />
        {isAdmin && (
          <Tab.Screen name="Users" component={UsersScreen} options={{ tabBarLabel: 'Usuarios' }} />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: isWeb ? 'center' : undefined }}>
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 680 : undefined }}>
        {content}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
