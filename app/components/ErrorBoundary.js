import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#e74c3c' },
  message: { fontSize: 14, color: '#333', textAlign: 'center' },
});
