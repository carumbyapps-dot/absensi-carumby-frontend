import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, font, spacing, typography } from '@/theme';

interface Props {
  uri?: string | null;
  height?: number;
  label?: string;
}

export default function PhotoPlaceholder({ uri, height = 240, label = 'Foto selfie' }: Props) {
  if (uri) {
    return (
      <View style={[styles.wrap, { height }]}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={[styles.wrap, { height }, styles.empty]}>
      <View style={styles.iconWrap}>
        <Ionicons name="person" size={32} color={colors.ink38} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>Foto diambil saat absen (data tiruan)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.ink12,
    backgroundColor: colors.bone,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderStyle: 'dashed',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.label,
    color: colors.ink60,
    fontSize: 10,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: font.tiny,
    color: colors.ink38,
  },
});