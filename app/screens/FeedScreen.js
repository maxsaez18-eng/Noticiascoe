import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput,
  StyleSheet, Linking, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import FilterBar from '../components/FilterBar';
import { getNoticias, markLeido, markBulkLeido, toggleFavorito, fetchNews } from '../api';

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

function shortenUrl(url, maxLen = 40) {
  if (!url) return '';
  try {
    const u = new URL(url);
    let short = u.hostname.replace('www.', '') + u.pathname;
    if (short.length > maxLen) short = short.slice(0, maxLen) + '...';
    return short;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '...' : url;
  }
}

export default function FeedScreen({ route, navigation }) {
  const { colors } = useTheme();
  const [allNoticias, setAllNoticias] = useState([]);
  const [filteredNoticias, setFilteredNoticias] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const searchTimer = useRef(null);

  const isAllSelected = selectionMode && filteredNoticias.length > 0 && filteredNoticias.every(n => selectedIds.has(n.id));

  const loadSearch = useCallback(async (text) => {
    try {
      const data = await getNoticias(50, 0, text);
      setAllNoticias(data || []);
      setFilteredNoticias(data || []);
      setHasMore((data || []).length >= 50);
    } catch (e) {
      console.warn('load error', e);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await getNoticias(50, allNoticias.length, searchText);
      if (data && data.length > 0) {
        setAllNoticias(prev => [...prev, ...data]);
        if (data.length < 50) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.warn('loadMore error', e);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, allNoticias.length, searchText]);

  const onSearchChange = useCallback((text) => {
    setSearchText(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadSearch(text), 300);
  }, [loadSearch]);

  const onSearchSubmit = useCallback(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    loadSearch(searchText);
  }, [loadSearch, searchText]);

  const clearSearch = useCallback(() => {
    setSearchText('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    loadSearch('');
  }, [loadSearch]);

  const doRefresh = useCallback(async () => {
    setSyncing(true);
    await fetchNews();
    await load(searchText);
    setSyncing(false);
  }, [load, searchText]);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => {
    if (route.params?.refresh) {
      route.params.refresh = false;
      doRefresh();
    }
  }, [route?.params?.refresh]));

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNoticias.map(n => n.id)));
    }
  };

  const markSelected = async (leido) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await markBulkLeido(ids, leido);
    setAllNoticias(prev => prev.map(n =>
      selectedIds.has(n.id) ? { ...n, leido } : n
    ));
    exitSelectionMode();
  };

  const onCardPress = async (item) => {
    if (selectionMode) {
      toggleSelection(item.id);
      return;
    }
    if (!item.leido) {
      await markLeido(item.id);
      setAllNoticias(prev => prev.map(n => n.id === item.id ? { ...n, leido: true } : n));
    }
    Linking.openURL(item.url);
  };

  const onCardLongPress = (item) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([item.id]));
    }
  };

  const onFav = async (item) => {
    if (selectionMode) return;
    const res = await toggleFavorito(item.id);
    setAllNoticias(prev => prev.map(n =>
      n.id === item.id ? { ...n, favorito: res.favorito } : n
    ));
  };

  const s = makeStyles(colors);

  const renderCard = ({ item }) => {
    const selected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[
          s.card,
          !item.leido && s.unread,
          selected && s.selected,
        ]}
        onPress={() => onCardPress(item)}
        onLongPress={() => onCardLongPress(item)}
        activeOpacity={0.8}
      >
        <View style={s.cardRow}>
          {selectionMode && (
            <View style={[s.checkbox, selected && s.checkboxSelected]}>
              {selected && <Text style={s.checkMark}>✓</Text>}
            </View>
          )}
          <View style={s.cardContent}>
            <View style={s.cardHeader}>
              <Text style={s.cardSource}>{item.fuente || 'Desconocido'}</Text>
              <Text style={s.cardDate}>{timeAgo(item.fecha_publicacion)}</Text>
            </View>
            {item.traducido && <Text style={s.transBadge}>TRADUCIDO</Text>}
            <Text style={s.cardTitle}>{item.titulo}</Text>
            {item.descripcion ? (
              <Text style={s.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
            ) : null}
            <View style={s.cardFooter}>
              <Text style={s.cardUrl} numberOfLines={1}>{shortenUrl(item.url)}</Text>
              {!selectionMode && (
                <View style={s.cardActions}>
                  <TouchableOpacity onPress={() => onFav(item)} style={s.actionBtn}>
                    <Text style={[s.actionIcon, item.favorito && s.favActive]}>
                      {item.favorito ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={s.actionBtn}>
                    <Text style={s.actionIcon}>↗</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        {selectionMode ? (
          <>
            <View style={s.selectionToolbar}>
              <TouchableOpacity onPress={exitSelectionMode} style={s.cancelBtn}>
                <Text style={s.cancelBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={s.selectionCount}>{selectedIds.size} seleccionados</Text>
              <TouchableOpacity onPress={selectAll} style={s.selectAllBtn}>
                <Text style={s.selectAllText}>{isAllSelected ? 'Ninguno' : 'Todos'}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.bulkActions}>
              <TouchableOpacity
                style={[s.bulkBtn, selectedIds.size === 0 && s.bulkBtnDisabled]}
                onPress={() => markSelected(true)}
                disabled={selectedIds.size === 0}
              >
                <Text style={s.bulkBtnText}>✓ Leído</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.bulkBtn, selectedIds.size === 0 && s.bulkBtnDisabled]}
                onPress={() => markSelected(false)}
                disabled={selectedIds.size === 0}
              >
                <Text style={s.bulkBtnText}>○ No leído</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={s.headerRow}>
              <Text style={s.headerTitle}>Feed de Noticias</Text>
              <View style={s.headerActions}>
                <TouchableOpacity
                  style={s.selectBtn}
                  onPress={() => setSelectionMode(true)}
                >
                  <Text style={s.selectBtnText}>☰</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.refreshBtn, syncing && s.refreshBtnDisabled]}
                  onPress={doRefresh}
                  disabled={syncing}
                >
                  <Text style={s.refreshText}>↻</Text>
                </TouchableOpacity>
              </View>
            </View>
            {syncing && <Text style={s.syncingText}>Sincronizando...</Text>}
            {!selectionMode && (
              <View style={s.searchRow}>
                <TextInput
                  style={s.searchInput}
                  placeholder="Buscar en todas las noticias..."
                  placeholderTextColor={colors.text3}
                  value={searchText}
                  onChangeText={onSearchChange}
                  onSubmitEditing={onSearchSubmit}
                  returnKeyType="search"
                />
                {searchText ? (
                  <TouchableOpacity onPress={clearSearch} style={s.searchClear}>
                    <Text style={s.searchClearText}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </>
        )}
      </View>

      {!selectionMode && <FilterBar noticias={allNoticias} onFilter={setFilteredNoticias} />}

      <FlatList
        data={filteredNoticias}
        renderItem={renderCard}
        keyExtractor={item => item.id?.toString() || item.url}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await doRefresh(); setRefreshing(false); }}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <Text style={s.empty}>
            {allNoticias.length === 0
              ? 'Tira hacia abajo para sincronizar'
              : 'Sin resultados con esos filtros'}
          </Text>
        }
        ListFooterComponent={loadingMore ? (
          <View style={s.footer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={s.footerText}>Cargando más...</Text>
          </View>
        ) : hasMore ? (
          <View style={s.footer}>
            <Text style={s.footerHint}>Desliza para cargar más</Text>
          </View>
        ) : (
          <View style={s.footer}>
            <Text style={s.footerEnd}>Todas las noticias cargadas</Text>
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 60,
      paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
    headerActions: { flexDirection: 'row', gap: 8 },
    selectBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    selectBtnText: { fontSize: 16, color: colors.text },
    refreshBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    },
    refreshBtnDisabled: { opacity: 0.5 },
    refreshText: { fontSize: 18, color: '#fff' },
    syncingText: { fontSize: 12, color: colors.accent, marginTop: 4 },
    searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    searchInput: {
      flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
      backgroundColor: colors.surface2, color: colors.text,
    },
    searchClear: { padding: 6 },
    searchClearText: { fontSize: 16, color: colors.text3 },
    selectionToolbar: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 8,
    },
    cancelBtn: { padding: 4 },
    cancelBtnText: { fontSize: 20, color: colors.text, fontWeight: '600' },
    selectionCount: { fontSize: 15, fontWeight: '600', color: colors.text },
    selectAllBtn: { padding: 4 },
    selectAllText: { fontSize: 14, color: colors.accent, fontWeight: '600' },
    bulkActions: { flexDirection: 'row', gap: 8 },
    bulkBtn: {
      flex: 1, backgroundColor: colors.accent, borderRadius: 8,
      paddingVertical: 10, alignItems: 'center',
    },
    bulkBtnDisabled: { opacity: 0.4 },
    bulkBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    list: { padding: 10, paddingBottom: 20 },
    empty: { textAlign: 'center', color: colors.text3, marginTop: 60, fontSize: 15 },
    card: {
      backgroundColor: colors.surface, borderRadius: 10, padding: 14,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    },
    unread: { borderLeftWidth: 3, borderLeftColor: colors.accent },
    selected: { borderColor: colors.accent, backgroundColor: colors.surface2 },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
    checkbox: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2,
      borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
      marginRight: 10, marginTop: 2,
    },
    checkboxSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
    checkMark: { fontSize: 12, color: '#fff', fontWeight: '700' },
    cardContent: { flex: 1 },
    cardHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 4,
    },
    cardSource: { fontSize: 12, fontWeight: '600', color: colors.accent },
    cardDate: { fontSize: 11, color: colors.text3 },
    transBadge: {
      fontSize: 9, fontWeight: '700', color: colors.transText, marginBottom: 4,
      backgroundColor: colors.transBg, alignSelf: 'flex-start',
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3,
      overflow: 'hidden',
    },
    cardTitle: {
      fontSize: 15, fontWeight: '600', color: colors.text,
      lineHeight: 20, marginBottom: 4,
    },
    cardDesc: { fontSize: 12, color: colors.text2, lineHeight: 16 },
    cardFooter: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginTop: 8, paddingTop: 8,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    cardUrl: { fontSize: 10, color: colors.text3, flex: 1, marginRight: 8 },
    cardActions: { flexDirection: 'row', gap: 4 },
    actionBtn: { padding: 4 },
    actionIcon: { fontSize: 16, color: colors.text3 },
    favActive: { color: colors.danger },
    footer: { alignItems: 'center', paddingVertical: 16 },
    footerText: { fontSize: 13, color: colors.accent, marginTop: 6 },
    footerHint: { fontSize: 12, color: colors.text3 },
    footerEnd: { fontSize: 12, color: colors.text3 },
  });
}
