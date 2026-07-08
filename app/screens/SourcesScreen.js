import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { getFuentes, addFuente, deleteFuente, toggleFuente } from '../api';

export default function SourcesScreen() {
  const [fuentes, setFuentes] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const load = async () => setFuentes(await getFuentes());
  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    if (!name.trim() || !url.trim()) {
      if (Platform.OS === 'web') alert('Completa nombre y URL');
      else Alert.alert('Error', 'Completa nombre y URL');
      return;
    }
    const res = await addFuente(name.trim(), url.trim(), 'rss');
    if (res.error) {
      if (Platform.OS === 'web') alert(res.error);
      else Alert.alert('Error', res.error);
    }
    setName(''); setUrl('');
    await load();
  };

  const onDelete = (id) => {
    if (Platform.OS === 'web') {
      if (!confirm('Eliminar esta fuente?')) return;
    } else {
      Alert.alert('Confirmar', 'Eliminar esta fuente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await deleteFuente(id); await load();
        }},
      ]);
      return;
    }
    deleteFuente(id).then(load);
  };

  const onToggle = async (id) => {
    await toggleFuente(id); await load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fuentes RSS</Text>
        <Text style={styles.sub}>De dónde se obtienen las noticias</Text>
      </View>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
        <TextInput style={[styles.input, { flex: 2 }]} placeholder="URL del feed RSS" value={url} onChangeText={setUrl} onSubmitEditing={onAdd} />
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Text style={styles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={fuentes}
        keyExtractor={item => item._id || item.id?.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.nombre}</Text>
              <Text style={styles.url} numberOfLines={1}>{item.url}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.toggleBtn, item.activo ? styles.active : styles.inactive]} onPress={() => onToggle(item._id || item.id)}>
                <Text style={styles.toggleText}>{item.activo ? 'Activo' : 'Inactivo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item._id || item.id)}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  sub: { fontSize: 13, color: '#666', marginTop: 4 },
  form: { flexDirection: 'row', padding: 12, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#1d9bf0', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { padding: 12 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: '#e8e8e8' },
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '500' },
  url: { fontSize: 11, color: '#999', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#ddd' },
  active: { borderColor: '#2ecc71' },
  inactive: { borderColor: '#ddd' },
  toggleText: { fontSize: 12, fontWeight: '500', color: '#666' },
  deleteBtn: { paddingHorizontal: 8, justifyContent: 'center' },
  deleteText: { fontSize: 16, color: '#e74c3c' },
});
