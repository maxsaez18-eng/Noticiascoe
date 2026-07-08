import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCachedToken } from '../api';

const TOKEN_KEY = '@app-noticias:auth-token';
const USER_KEY = '@app-noticias:auth-user';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (token, user) => {
    setToken(token);
    setUser(user);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    clearCachedToken();
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const updateUser = async (updated) => {
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'admin' || user?.role === 'editor';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAdmin, isEditor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
