import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';

interface Props extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function FormField({ label, icon, style, ...rest }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} />}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.text,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    fontSize: font.body,
    color: colors.text,
  },
});