import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { getKeywords, addKeyword, deleteKeyword, toggleKeyword } from '../api';

export default function KeywordsScreen() {
  const { colors } = useTheme();
  const [keywords, setKeywords] = useState([]);
  const [input, setInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [batchResult, setBatchResult] = useState(null);

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

  const onAddBatch = async () => {
    const raw = batchInput.trim();
    if (!raw) return;

    const items = raw
      .split(/[\n,;]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    if (items.length === 0) return;

    setProcessing(true);
    setBatchResult(null);
    let added = 0, existed = 0, errors = 0;

    for (let i = 0; i < items.length; i++) {
      setProgress(`${i + 1}/${items.length}: "${items[i].slice(0, 30)}"`);
      try {
        const res = await addKeyword(items[i]);
        if (res.error) existed++;
        else added++;
      } catch {
        errors++;
      }
    }

    setBatchInput('');
    setProcessing(false);
    setProgress('');
    setBatchResult({ added, existed, errors, total: items.length });
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

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Palabras Clave</Text>
        <Text style={s.sub}>Las noticias se filtran por estas palabras</Text>
      </View>

      <View style={s.form}>
        <TextInput
          style={s.input}
          placeholder="Ej: inteligencia artificial"
          placeholderTextColor={colors.text3}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={onAdd}
        />
        <TouchableOpacity style={s.addBtn} onPress={onAdd}>
          <Text style={s.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <View style={s.batchSection}>
        <Text style={s.batchLabel}>Agregar múltiples (una por línea o separadas por coma)</Text>
        <TextInput
          style={s.batchInput}
          placeholder={`inteligencia artificial\nmachine learning\nblockchain`}
          placeholderTextColor={colors.text3}
          multiline
          value={batchInput}
          onChangeText={setBatchInput}
        />
        {processing ? (
          <Text style={s.progressText}>{progress}</Text>
        ) : (
          <TouchableOpacity
            style={[s.batchBtn, !batchInput.trim() && { opacity: 0.4 }]}
            onPress={onAddBatch}
            disabled={!batchInput.trim()}
          >
            <Text style={s.batchBtnText}>Agregar múltiples</Text>
          </TouchableOpacity>
        )}
        {batchResult && (
          <View style={s.resultBox}>
            <Text style={s.resultText}>
              +{batchResult.added} agregadas | {batchResult.existed} ya existían
              {batchResult.errors > 0 ? ` | ${batchResult.errors} errores` : ''}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={keywords}
        keyExtractor={item => item._id || item.id?.toString()}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.item}>
            <Text style={s.itemText}>{item.palabra}</Text>
            <View style={s.actions}>
              <TouchableOpacity
                style={[s.toggleBtn, item.activo ? s.active : s.inactive]}
                onPress={() => onToggle(item._id || item.id)}
              >
                <Text style={s.toggleText}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => onDelete(item._id || item.id)}>
                <Text style={s.deleteText}>✕</Text>
              </TouchableOpacity>
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
    form: { flexDirection: 'row', padding: 12, gap: 8, paddingBottom: 4 },
    input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: colors.surface2, color: colors.text },
    addBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    batchSection: { paddingHorizontal: 12, paddingBottom: 8 },
    batchLabel: { fontSize: 12, color: colors.text2, marginBottom: 4 },
    batchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: colors.surface2, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
    batchBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    batchBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    progressText: { textAlign: 'center', color: colors.accent, fontSize: 13, marginTop: 8, fontWeight: '500' },
    resultBox: { backgroundColor: colors.surface, borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: colors.success },
    resultText: { fontSize: 13, color: colors.text, textAlign: 'center' },
    list: { padding: 12 },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 8, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
    itemText: { fontSize: 15, fontWeight: '500', color: colors.text },
    actions: { flexDirection: 'row', gap: 6 },
    toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
    active: { borderColor: colors.success },
    inactive: { borderColor: colors.border },
    toggleText: { fontSize: 12, fontWeight: '500', color: colors.text2 },
    deleteBtn: { paddingHorizontal: 8, justifyContent: 'center' },
    deleteText: { fontSize: 16, color: colors.danger },
  });
}
