import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getStats, changePassword } from '../api';

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
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    const load = async () => setStats(await getStats());
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleChangePassword = async () => {
    setPwdError('');
    if (!currentPassword || !newPassword) { setPwdError('Completa todos los campos'); return; }
    if (newPassword.length < 4) { setPwdError('La nueva contraseña debe tener al menos 4 caracteres'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Las contraseñas no coinciden'); return; }
    setPwdLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPwdLoading(false);
    if (res.error) {
      setPwdError(res.error);
    } else {
      setShowPwdModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

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
        <TouchableOpacity style={s.pwdBtn} onPress={() => setShowPwdModal(true)}>
          <Text style={s.pwdBtnText}>Cambiar contraseña</Text>
        </TouchableOpacity>
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

      <Modal visible={showPwdModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Cambiar contraseña</Text>

            {pwdError ? <Text style={s.error}>{pwdError}</Text> : null}

            <TextInput
              style={s.input}
              placeholder="Contraseña actual"
              placeholderTextColor={colors.text3}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              editable={!pwdLoading}
            />
            <TextInput
              style={s.input}
              placeholder="Nueva contraseña"
              placeholderTextColor={colors.text3}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              editable={!pwdLoading}
            />
            <TextInput
              style={s.input}
              placeholder="Confirmar nueva contraseña"
              placeholderTextColor={colors.text3}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!pwdLoading}
              onSubmitEditing={handleChangePassword}
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => { setShowPwdModal(false); setPwdError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
              >
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, pwdLoading && { opacity: 0.5 }]}
                onPress={handleChangePassword}
                disabled={pwdLoading}
              >
                {pwdLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    pwdBtn: {
      backgroundColor: colors.surface2, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 10, alignItems: 'center', marginBottom: 8,
    },
    pwdBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    error: {
      backgroundColor: colors.danger + '18', color: colors.danger,
      padding: 10, borderRadius: 8, marginBottom: 12,
      textAlign: 'center', fontSize: 13, fontWeight: '500',
      overflow: 'hidden',
    },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
      backgroundColor: colors.surface2, color: colors.text, marginBottom: 12,
    },
    modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
    cancelText: { fontSize: 14, color: colors.text2 },
    saveBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, minWidth: 80, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  });
}
