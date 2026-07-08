import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getStats } from '../api';

const statConfig = [
  { key: 'total', label: 'Total Noticias' },
  { key: 'noLeidas', label: 'Sin Leer' },
  { key: 'favoritas', label: 'Favoritas' },
  { key: 'traducidas', label: 'Traducidas' },
  { key: 'keywords', label: 'Keywords Activas' },
  { key: 'fuentes', label: 'Fuentes Activas' },
];

const THEME_OPTIONS = [
  { label: 'Automático', value: 'auto' },
  { label: 'Claro', value: 'light' },
  { label: 'Oscuro', value: 'dark' },
];

export default function StatsScreen({ navigation }) {
  const { colors, isDark, mode, setThemeMode } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => setStats(await getStats());
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const s = makeStyles(colors);

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Ajustes</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Usuario</Text>
        <View style={s.userInfo}>
          <Text style={s.username}>{user?.username}</Text>
          <Text style={s.roleBadge}>{user?.role}</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {isAdmin && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Administración</Text>
          <TouchableOpacity
            style={s.adminBtn}
            onPress={() => navigation.navigate('Users')}
          >
            <Text style={s.adminBtnText}>Gestionar Usuarios</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Tema</Text>
        <View style={s.themeRow}>
          {THEME_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.themeBtn, mode === opt.value && s.themeBtnActive]}
              onPress={() => setThemeMode(opt.value)}
            >
              <Text style={[s.themeBtnText, mode === opt.value && s.themeBtnTextActive]}>
                {opt.value === 'auto' ? (isDark ? '☾' : '☀') + ' ' : ''}
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.hint}>
          {mode === 'auto'
            ? `Siguiendo el tema del sistema (${isDark ? 'oscuro' : 'claro'})`
            : `Tema ${mode === 'dark' ? 'oscuro' : 'claro'} fijo`}
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Estadísticas</Text>
        <View style={s.grid}>
          {statConfig.map(stat => (
            <View key={stat.key} style={s.card}>
              <Text style={s.value}>{stats ? stats[stat.key] : '-'}</Text>
              <Text style={s.label}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 60, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },
    section: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    username: { fontSize: 16, fontWeight: '600', color: colors.text },
    roleBadge: {
      fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2,
      borderRadius: 4, backgroundColor: colors.accent + '20', color: colors.accent,
      overflow: 'hidden',
    },
    logoutBtn: {
      backgroundColor: colors.danger, borderRadius: 8, paddingVertical: 10,
      alignItems: 'center',
    },
    logoutText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    adminBtn: {
      backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12,
      alignItems: 'center',
    },
    adminBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    themeRow: { flexDirection: 'row', gap: 8 },
    themeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface2 },
    themeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent + '18' },
    themeBtnText: { fontSize: 13, color: colors.text2, fontWeight: '500' },
    themeBtnTextActive: { color: colors.accent },
    hint: { fontSize: 12, color: colors.text3, marginTop: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
      width: '47%', backgroundColor: colors.surface, borderRadius: 10,
      padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    value: { fontSize: 28, fontWeight: '700', color: colors.accent },
    label: { fontSize: 12, color: colors.text2, marginTop: 4, textAlign: 'center' },
  });
}
