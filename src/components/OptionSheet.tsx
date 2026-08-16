import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, font, spacing, typography } from '@/theme';

export interface SheetOption {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
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
                size={18}
                color={option.destructive ? colors.red : colors.ink}
              />
              <Text style={[styles.optionText, option.destructive && { color: colors.red }]}>
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
    backgroundColor: colors.ink90,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bone,
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    ...typography.label,
    color: colors.ink60,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.ink12,
  },
  pressed: {
    opacity: 0.6,
  },
  optionText: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  cancelText: {
    ...typography.label,
    color: colors.red,
  },
});