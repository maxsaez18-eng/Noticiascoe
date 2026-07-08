import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Completa ambos campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiLogin(username.trim(), password);
      if (res.error) {
        setError(res.error);
      } else {
        await login(res.token, res.user);
      }
    } catch {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Text style={s.title}>Noticias App</Text>
        <Text style={s.subtitle}>Inicia sesión</Text>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TextInput
          style={s.input}
          placeholder="Usuario"
          placeholderTextColor={colors.text3}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={s.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.text3}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.btnText}>Ingresar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1, backgroundColor: colors.bg,
      justifyContent: 'center', alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%', maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: 16, padding: 32,
      borderWidth: 1, borderColor: colors.border,
    },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.text2, textAlign: 'center', marginBottom: 24, marginTop: 4 },
    error: {
      backgroundColor: colors.danger + '18', color: colors.danger,
      padding: 10, borderRadius: 8, marginBottom: 16,
      textAlign: 'center', fontSize: 13, fontWeight: '500',
      overflow: 'hidden',
    },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
      backgroundColor: colors.surface2, color: colors.text,
      marginBottom: 12,
    },
    btn: {
      backgroundColor: colors.accent, borderRadius: 10,
      paddingVertical: 14, alignItems: 'center', marginTop: 8,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  });
}
