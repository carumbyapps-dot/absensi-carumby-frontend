import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, font, spacing, typography } from '@/theme';

interface Props {
  latitude: number;
  longitude: number;
  height?: number;
}

export default function MapPreview({ latitude, longitude, height = 160 }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Ionicons name="location" size={24} color={colors.red} />
      <Text style={styles.coords}>
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </Text>
      <Text style={styles.hint}>Peta tersedia di perangkat mobile (iOS/Android)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.ink12,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  coords: {
    fontFamily: fontFamily.semibold,
    fontSize: font.body,
    color: colors.ink,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: font.tiny,
    color: colors.ink38,
  },
});