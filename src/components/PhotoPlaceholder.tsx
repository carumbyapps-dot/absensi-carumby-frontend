import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';

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
        <Ionicons name="person" size={40} color={colors.textMuted} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>Foto diambil saat absen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#E9ECF5',
    borderStyle: 'dashed',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  hint: {
    fontSize: font.caption,
    color: colors.textMuted,
  },
});