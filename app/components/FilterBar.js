import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { getFuentes } from '../api';

const DATE_OPTIONS = [
  { label: 'Todo', value: 'all' },
  { label: 'Hoy', value: 'today' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
];

const READ_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'No leídos', value: 'unread' },
  { label: 'Leídos', value: 'read' },
];

function isInDateRange(dateStr, range) {
  if (range === 'all') return true;
  const date = new Date(dateStr);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'today') return date >= startOfDay;
  if (range === 'week') {
    const weekAgo = new Date(startOfDay.getTime() - 7 * 86400000);
    return date >= weekAgo;
  }
  if (range === 'month') {
    const monthAgo = new Date(startOfDay.getTime() - 30 * 86400000);
    return date >= monthAgo;
  }
  return true;
}

export default function FilterBar({ noticias, onFilter }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [fuentes, setFuentes] = useState([]);

  useEffect(() => {
    getFuentes().then(setFuentes).catch(() => {});
  }, []);

  useEffect(() => {
    const filtered = noticias.filter(n => {
      if (readFilter === 'unread' && n.leido) return false;
      if (readFilter === 'read' && !n.leido) return false;
      if (sourceFilter !== 'all' && n.fuente !== sourceFilter) return false;
      if (!isInDateRange(n.fecha_publicacion, dateRange)) return false;
      return true;
    });
    onFilter(filtered);
  }, [noticias, dateRange, readFilter, sourceFilter]);

  const activeCount = [dateRange !== 'all' ? '1' : '', readFilter !== 'all' ? '1' : '', sourceFilter !== 'all' ? '1' : ''].filter(Boolean).length;

  const styles = makeStyles(colors);
  const s = styles;

  return (
    <View>
      <TouchableOpacity style={s.toggleBtn} onPress={() => setOpen(!open)}>
        <Text style={s.toggleText}>
          {open ? '▲ Ocultar filtros' : `▼ Filtrar${activeCount > 0 ? ` (${activeCount})` : ''}`}
        </Text>
        {activeCount > 0 && <View style={s.activeDot} />}
      </TouchableOpacity>

      {open && (
        <View style={s.panel}>
          <Text style={s.label}>Fecha</Text>
          <View style={s.chips}>
            {DATE_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[s.chip, dateRange === o.value && s.chipActive]}
                onPress={() => setDateRange(o.value)}
              >
                <Text style={[s.chipText, dateRange === o.value && s.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Estado</Text>
          <View style={s.chips}>
            {READ_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[s.chip, readFilter === o.value && s.chipActive]}
                onPress={() => setReadFilter(o.value)}
              >
                <Text style={[s.chipText, readFilter === o.value && s.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Fuente</Text>
          <View style={s.chips}>
            <TouchableOpacity
              style={[s.chip, sourceFilter === 'all' && s.chipActive]}
              onPress={() => setSourceFilter('all')}
            >
              <Text style={[s.chipText, sourceFilter === 'all' && s.chipTextActive]}>Todas</Text>
            </TouchableOpacity>
            {fuentes.filter(f => f.activo).map(f => (
              <TouchableOpacity
                key={f._id || f.id}
                style={[s.chip, sourceFilter === f.nombre && s.chipActive]}
                onPress={() => setSourceFilter(sourceFilter === f.nombre ? 'all' : f.nombre)}
              >
                <Text style={[s.chipText, sourceFilter === f.nombre && s.chipTextActive]}>{f.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeCount > 0 && (
            <TouchableOpacity
              style={s.clearBtn}
              onPress={() => { setDateRange('all'); setReadFilter('all'); setSourceFilter('all'); }}
            >
              <Text style={s.clearText}>✕ Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  toggleText: { fontSize: 13, color: colors.accent, fontWeight: '600' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  panel: {
    backgroundColor: colors.surface, marginHorizontal: 12, marginBottom: 8,
    borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.border,
    gap: 10,
  },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
    backgroundColor: colors.surface2, color: colors.text,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.text2, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accent + '18' },
  chipText: { fontSize: 12, color: colors.text2 },
  chipTextActive: { color: colors.accent, fontWeight: '600' },
  clearBtn: { alignItems: 'center', paddingVertical: 6, marginTop: 4 },
  clearText: { fontSize: 13, color: colors.danger },
});
