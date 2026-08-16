import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, spacing, typography } from '@/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export default function MenuCard({
  icon,
  iconColor = colors.red,
  title,
  subtitle,
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  pressed: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.ink12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
  },
  subtitle: {
    fontFamily: 'Archivo_400Regular',
    fontSize: font.caption,
    color: colors.ink60,
  },
});