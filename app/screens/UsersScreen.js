import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform, ScrollView, Modal,
} from 'react-native';
import { useTheme } from '../theme';
import { getUsers, register, updateUser } from '../api';

export default function UsersScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  const load = async () => setUsers(await getUsers());
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      if (Platform.OS === 'web') alert('Completa usuario y contraseña');
      else Alert.alert('Error', 'Completa usuario y contraseña');
      return;
    }
    const res = await register(newUsername.trim(), newPassword, newRole);
    if (res.error) {
      if (Platform.OS === 'web') alert(res.error);
      else Alert.alert('Error', res.error);
    } else {
      setShowCreate(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('viewer');
      await load();
    }
  };

  const handleRoleChange = (id, currentRole) => {
    const roles = ['admin', 'editor', 'viewer'];
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % 3];
    updateUser(id, { role: nextRole }).then(load);
  };

  const handleResetPassword = (id) => {
    if (Platform.OS === 'web') {
      const pwd = prompt('Nueva contraseña:');
      if (pwd) updateUser(id, { password: pwd }).then(load);
    } else {
      Alert.prompt('Nueva contraseña', 'Ingresa la nueva contraseña:', async (pwd) => {
        if (pwd) { await updateUser(id, { password: pwd }); await load(); }
      });
    }
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Usuarios</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={s.addBtnText}>+ Crear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item._id?.toString()}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={s.info}>
              <Text style={s.name}>{item.username}</Text>
              <TouchableOpacity onPress={() => handleRoleChange(item._id, item.role)}>
                <Text style={[s.role, item.role === 'admin' ? s.roleAdmin : item.role === 'editor' ? s.roleEditor : s.roleViewer]}>
                  {item.role}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.resetBtn} onPress={() => handleResetPassword(item._id)}>
              <Text style={s.resetText}>Cambiar contraseña</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Crear Usuario</Text>
            <TextInput
              style={s.input}
              placeholder="Usuario"
              placeholderTextColor={colors.text3}
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={s.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.text3}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <Text style={s.label}>Rol:</Text>
            <View style={s.roleRow}>
              {['viewer', 'editor', 'admin'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[s.roleBtn, newRole === r && s.roleBtnActive]}
                  onPress={() => setNewRole(r)}
                >
                  <Text style={[s.roleBtnText, newRole === r && s.roleBtnTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowCreate(false); setNewUsername(''); setNewPassword(''); setNewRole('viewer'); }}>
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.createBtn} onPress={handleCreate}>
                <Text style={s.createBtnText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 60, paddingBottom: 12,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },
    addBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    list: { padding: 12 },
    item: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.surface, borderRadius: 8, padding: 14, marginBottom: 6,
      borderWidth: 1, borderColor: colors.border,
    },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: '600', color: colors.text },
    role: { fontSize: 12, fontWeight: '500', marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
    roleAdmin: { backgroundColor: colors.warning + '20', color: colors.warning },
    roleEditor: { backgroundColor: colors.accent + '20', color: colors.accent },
    roleViewer: { backgroundColor: colors.surface2, color: colors.text2, borderWidth: 1, borderColor: colors.border },
    resetBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    resetText: { fontSize: 13, color: colors.accent, fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modal: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
      backgroundColor: colors.surface2, color: colors.text, marginBottom: 12,
    },
    label: { fontSize: 13, color: colors.text2, fontWeight: '500', marginBottom: 6 },
    roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    roleBtn: {
      flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
      borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface2,
    },
    roleBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent + '18' },
    roleBtnText: { fontSize: 13, color: colors.text2, fontWeight: '500' },
    roleBtnTextActive: { color: colors.accent },
    modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
    cancelText: { fontSize: 14, color: colors.text2 },
    createBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
    createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  });
}
