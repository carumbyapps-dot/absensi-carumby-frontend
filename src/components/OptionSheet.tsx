import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';

export interface SheetOption {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title: string;
  options: SheetOption[];
  onClose: () => void;
}

export default function OptionSheet({ visible, title, options, onClose }: Props) {
  const handlePress = (option: SheetOption) => {
    option.onPress();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {options.map((option) => (
            <Pressable
              key={option.label}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              onPress={() => handlePress(option)}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={option.destructive ? colors.danger : option.color ?? colors.primary}
              />
              <Text
                style={[
                  styles.optionText,
                  option.destructive && { color: colors.danger },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Batal</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.7,
  },
  optionText: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  cancelText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.primary,
  },
});