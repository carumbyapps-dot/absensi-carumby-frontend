import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadCsvContent } from '@/lib/export';
import { colors, font, fontFamily, spacing, typography } from '@/theme';

interface Template {
  filename: string;
  content: string;
}

interface Props {
  visible: boolean;
  title: string;
  hint: string;
  placeholder: string;
  busy: boolean;
  template?: Template;
  onSubmit: (csv: string) => void;
  onClose: () => void;
}

/** Modal tempel CSV untuk impor massal (web & native). */
export default function CsvImportModal({ visible, title, hint, placeholder, busy, template, onSubmit, onClose }: Props) {
  const [text, setText] = useState('');

  const close = () => {
    setText('');
    onClose();
  };

  const downloadTemplate = async () => {
    if (!template) return;
    const ok = await downloadCsvContent(template.filename, template.content);
    if (!ok) {
      Alert.alert('Template disalin', 'Template disalin ke clipboard — tempel di Excel/Sheets lalu isi sesuai format.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.hint}>{hint}</Text>
              {template && (
                <Pressable style={({ pressed }) => [styles.templateBtn, pressed && styles.pressed]} onPress={downloadTemplate}>
                  <Ionicons name="download-outline" size={13} color={colors.red} />
                  <Text style={styles.templateText}>Unduh Template</Text>
                </Pressable>
              )}
            </View>
            <Pressable style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]} onPress={close}>
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.area}
              placeholder={placeholder}
              placeholderTextColor={colors.ink38}
              multiline
              value={text}
              onChangeText={setText}
              autoFocus
            />
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]} onPress={close} disabled={busy}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
              onPress={() => onSubmit(text)}
              disabled={busy || !text.trim()}
            >
              {busy ? <ActivityIndicator color={colors.bone} size="small" /> : <Text style={styles.submitText}>Impor</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.ink90,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.ink,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.label,
    fontSize: 13,
    color: colors.ink,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  templateText: {
    ...typography.label,
    fontSize: 10,
    color: colors.red,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  area: {
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.md,
    minHeight: 180,
    textAlignVertical: 'top',
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: spacing.md,
  },
  cancelText: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
  },
  submitBtn: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingVertical: spacing.md,
  },
  submitText: {
    ...typography.label,
    fontSize: 11,
    color: colors.bone,
  },
  pressed: {
    opacity: 0.7,
  },
});