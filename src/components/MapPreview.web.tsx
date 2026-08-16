import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';

interface Props {
  latitude: number;
  longitude: number;
  height?: number;
}

export default function MapPreview({ latitude, longitude, height = 160 }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Ionicons name="location" size={28} color={colors.primary} />
      <Text style={styles.coords}>
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </Text>
      <Text style={styles.hint}>Peta tersedia di perangkat mobile (iOS/Android)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  coords: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: font.caption,
    color: colors.textMuted,
  },
});