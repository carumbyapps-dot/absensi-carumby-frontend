import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, typography } from '@/theme';

interface Props {
  /** Ukuran logo dalam px */
  size?: number;
  /** Tampilkan wordmark di samping logo */
  withWordmark?: boolean;
  /** Warna teks wordmark (default: ink) */
  wordmarkColor?: string;
}

/**
 * Mark Carumby Adventure (logo resmi). File: assets/logo.png.
 */
export default function BrandMark({ size = 40, withWordmark = false, wordmarkColor = colors.ink }: Props) {
  return (
    <View style={styles.row}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {withWordmark && (
        <View style={styles.wordmarkWrap}>
          <Text style={[styles.wordmark, { color: wordmarkColor }]}>CARUMBY</Text>
          <Text style={[styles.wordmarkSub, { color: wordmarkColor }]}>ADVENTURE</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmarkWrap: {
    gap: 0,
  },
  wordmark: {
    fontFamily: fontFamily.black,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  wordmarkSub: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 3,
  },
});