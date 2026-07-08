import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, Linking, Platform,
} from 'react-native';
import { getNoticias, markLeido, toggleFavorito, fetchNews, getStats } from '../api';

function timeAgo(dateStr) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function FeedScreen() {
  const [noticias, setNoticias] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const data = await getNoticias(50);
    setNoticias(data);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSyncing(true);
    await fetchNews();
    await load();
    setSyncing(false);
    setRefreshing(false);
  }, [load]);

  useEffect(() => { load(); }, [load]);

  const onCardPress = async (item) => {
    if (!item.leido) {
      await markLeido(item.id);
      setNoticias(prev => prev.map(n => n.id === item.id ? { ...n, leido: true } : n));
    }
    Linking.openURL(item.url);
  };

  const onFav = async (item) => {
    const res = await toggleFavorito(item.id);
    setNoticias(prev => prev.map(n =>
      n.id === item.id ? { ...n, favorito: res.favorito } : n
    ));
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.leido && styles.unread]}
      onPress={() => onCardPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardSource}>{item.fuente || 'Desconocido'}</Text>
        <Text style={styles.cardDate}>{timeAgo(item.fecha_publicacion)}</Text>
      </View>
      {item.traducido && <Text style={styles.transBadge}>TRADUCIDO</Text>}
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      {item.descripcion ? (
        <Text style={styles.cardDesc} numberOfLines={3}>{item.descripcion}</Text>
      ) : null}
      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={() => onFav(item)} style={styles.favBtn}>
          <Text style={[styles.favIcon, item.favorito && styles.favActive]}>
            {item.favorito ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed de Noticias</Text>
        {syncing && <Text style={styles.syncingText}>Sincronizando...</Text>}
      </View>
      <FlatList
        data={noticias}
        renderItem={renderCard}
        keyExtractor={item => item.id?.toString() || item.url}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Tira hacia abajo para sincronizar</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 60,
    paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  syncingText: { fontSize: 12, color: '#1d9bf0', marginTop: 4 },
  list: { padding: 12 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#e8e8e8',
  },
  unread: { borderLeftWidth: 3, borderLeftColor: '#1d9bf0' },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  cardSource: { fontSize: 12, fontWeight: '600', color: '#1d9bf0' },
  cardDate: { fontSize: 11, color: '#999' },
  transBadge: {
    fontSize: 10, fontWeight: '700', color: '#2e7d32', marginBottom: 4,
    backgroundColor: '#e8f5e9', alignSelf: 'flex-start',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16, fontWeight: '600', color: '#1a1a1a',
    lineHeight: 22, marginBottom: 6,
  },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'flex-end',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee',
  },
  favBtn: { padding: 4 },
  favIcon: { fontSize: 18, color: '#999' },
  favActive: { color: '#e74c3c' },
});
