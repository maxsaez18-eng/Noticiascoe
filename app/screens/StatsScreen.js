import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getStats } from '../api';

const statConfig = [
  { key: 'total', label: 'Total Noticias' },
  { key: 'noLeidas', label: 'Sin Leer' },
  { key: 'favoritas', label: 'Favoritas' },
  { key: 'traducidas', label: 'Traducidas' },
  { key: 'keywords', label: 'Keywords Activas' },
  { key: 'fuentes', label: 'Fuentes Activas' },
];

export default function StatsScreen() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => setStats(await getStats());
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
      </View>
      <View style={styles.grid}>
        {statConfig.map(s => (
          <View key={s.key} style={styles.card}>
            <Text style={styles.value}>{stats ? stats[s.key] : '-'}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  card: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#e8e8e8',
  },
  value: { fontSize: 32, fontWeight: '700', color: '#1d9bf0' },
  label: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' },
});
