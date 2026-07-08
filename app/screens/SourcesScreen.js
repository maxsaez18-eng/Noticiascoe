import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getFuentes, addFuente, deleteFuente, toggleFuente, fetchNews } from '../api';

export default function SourcesScreen({ navigation }) {
  const { colors } = useTheme();
  const { isEditor } = useAuth();
  const [fuentes, setFuentes] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => setFuentes(await getFuentes());
  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    if (!name.trim() || !url.trim()) {
      if (Platform.OS === 'web') alert('Completa nombre y URL');
      else Alert.alert('Error', 'Completa nombre y URL');
      return;
    }
    setAdding(true);
    const res = await addFuente(name.trim(), url.trim(), 'rss');
    setName(''); setUrl('');
    if (res.error) {
      if (Platform.OS === 'web') alert(res.error);
      else Alert.alert('Error', res.error);
      setAdding(false);
      return;
    }
    await load();
    await fetchNews();
    setAdding(false);
    navigation.navigate('Feed', { refresh: true });
  };

  const onDelete = (id) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Eliminar esta fuente?')
      : new Promise(resolve => {
          Alert.alert('Confirmar', 'Eliminar esta fuente?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (Platform.OS === 'web') {
      if (!confirm) return;
      deleteFuente(id).then(load);
    }
  };

  const onToggle = async (id) => {
    await toggleFuente(id); await load();
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Fuentes RSS</Text>
        <Text style={s.sub}>De dónde se obtienen las noticias</Text>
      </View>

      {isEditor && (
        <View style={s.form}>
          <TextInput style={s.input} placeholder="Nombre" placeholderTextColor={colors.text3} value={name} onChangeText={setName} />
          <TextInput style={[s.input, { flex: 2 }]} placeholder="URL del feed RSS" placeholderTextColor={colors.text3} value={url} onChangeText={setUrl} onSubmitEditing={onAdd} />
          <TouchableOpacity style={[s.addBtn, adding && { opacity: 0.5 }]} onPress={onAdd} disabled={adding}>
            {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.addBtnText}>Agregar</Text>}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={fuentes}
        keyExtractor={item => item._id || item.id?.toString()}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={s.info}>
              <Text style={s.name}>{item.nombre}</Text>
              <Text style={s.url} numberOfLines={1}>{item.url}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={[s.toggleBtn, item.activo ? s.active : s.inactive]} onPress={() => onToggle(item._id || item.id)}>
                <Text style={s.toggleText}>{item.activo ? 'Activo' : 'Inactivo'}</Text>
              </TouchableOpacity>
              {isEditor && (
                <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item._id || item.id)}>
                  <Text style={s.deleteText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 60, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },
    sub: { fontSize: 13, color: colors.text2, marginTop: 4 },
    form: { flexDirection: 'row', padding: 12, gap: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: colors.surface2, color: colors.text },
    addBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center', minWidth: 70 },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    list: { padding: 12 },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 8, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
    info: { flex: 1, marginRight: 12 },
    name: { fontSize: 15, fontWeight: '500', color: colors.text },
    url: { fontSize: 11, color: colors.text3, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
    active: { borderColor: colors.success },
    inactive: { borderColor: colors.border },
    toggleText: { fontSize: 12, fontWeight: '500', color: colors.text2 },
    deleteBtn: { paddingHorizontal: 8, justifyContent: 'center' },
    deleteText: { fontSize: 16, color: colors.danger },
  });
}
