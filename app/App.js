import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import FeedScreen from './screens/FeedScreen';
import KeywordsScreen from './screens/KeywordsScreen';
import SourcesScreen from './screens/SourcesScreen';
import StatsScreen from './screens/StatsScreen';

const Tab = createBottomTabNavigator();

function getIcon(name, focused) {
  const map = {
    Feed: focused ? 'newspaper' : 'newspaper-outline',
    Keywords: focused ? 'pricetags' : 'pricetags-outline',
    Sources: focused ? 'radio' : 'radio-outline',
    Stats: focused ? 'stats-chart' : 'stats-chart-outline',
  };
  return map[name] || 'ellipse';
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={getIcon(route.name, focused)} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#1d9bf0',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
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
        <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: 'Stats' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
