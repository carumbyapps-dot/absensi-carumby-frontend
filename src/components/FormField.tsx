import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, fontFamily, spacing, typography } from '@/theme';

interface Props extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function FormField({ label, icon, style, ...rest }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon && <Ionicons name={icon} size={18} color={colors.ink38} />}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.ink38}
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
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
});