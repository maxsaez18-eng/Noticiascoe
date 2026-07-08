import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { getKeywords, addKeyword, deleteKeyword, toggleKeyword } from '../api';

export default function KeywordsScreen() {
  const [keywords, setKeywords] = useState([]);
  const [input, setInput] = useState('');

  const load = async () => setKeywords(await getKeywords());
  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    const palabra = input.trim();
    if (!palabra) return;
    setInput('');
    const res = await addKeyword(palabra);
    if (res.error) {
      if (Platform.OS === 'web') alert(res.error);
      else Alert.alert('Error', res.error);
    }
    await load();
  };

  const onDelete = (id) => {
    if (Platform.OS === 'web') {
      if (!confirm('Eliminar esta keyword?')) return;
    } else {
      Alert.alert('Confirmar', 'Eliminar esta keyword?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await deleteKeyword(id); await load();
        }},
      ]);
      return;
    }
    deleteKeyword(id).then(load);
  };

  const onToggle = async (id) => {
    await toggleKeyword(id); await load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Palabras Clave</Text>
        <Text style={styles.sub}>Las noticias se filtran por estas palabras</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Ej: inteligencia artificial"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={onAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Text style={styles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={keywords}
        keyExtractor={item => item._id || item.id?.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.palabra}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.toggleBtn, item.activo ? styles.active : styles.inactive]}
                onPress={() => onToggle(item._id || item.id)}
              >
                <Text style={styles.toggleText}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </Text>
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
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#1d9bf0', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { padding: 12 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: '#e8e8e8' },
  itemText: { fontSize: 15, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 6 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#ddd' },
  active: { borderColor: '#2ecc71' },
  inactive: { borderColor: '#ddd' },
  toggleText: { fontSize: 12, fontWeight: '500', color: '#666' },
  deleteBtn: { paddingHorizontal: 8, justifyContent: 'center' },
  deleteText: { fontSize: 16, color: '#e74c3c' },
});
