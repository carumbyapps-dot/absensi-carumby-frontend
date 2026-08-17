import { Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: string | null;
}

/** Penangkap error render — menampilkan pesan di layar alih-alih layar kosong. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(err: unknown): State {
    return { error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) };
  }

  componentDidCatch(err: unknown) {
    console.error('[ErrorBoundary]', err);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.box}>
          <Text style={styles.title}>Terjadi kesalahan di layar ini</Text>
          <Text style={styles.detail}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: '#C1121F',
    margin: 16,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C1121F',
  },
  detail: {
    fontSize: 12,
    color: '#1E2622',
  },
});