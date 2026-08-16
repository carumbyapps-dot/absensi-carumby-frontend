import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, fontFamily, spacing, typography } from '@/theme';

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface Props {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (key: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DateField({ label, value, onChange, minimumDate, maximumDate }: Props) {
  const [show, setShow] = useState(false);
  const current = value ? parseKey(value) : new Date();

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="calendar-outline" size={18} color={colors.ink38} />
          <input
            type="date"
            value={value}
            min={minimumDate ? toKey(minimumDate) : undefined}
            max={maximumDate ? toKey(maximumDate) : undefined}
            onChange={(e) => onChange(e.target.value)}
            style={{
              flex: 1,
              padding: spacing.md + 2,
              fontFamily: fontFamily.regular,
              fontSize: font.body,
              color: colors.ink,
              borderWidth: 0,
              outline: 'none',
              background: 'transparent',
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.inputWrap, pressed && styles.pressed]}
        onPress={() => setShow(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.ink38} />
        <Text style={[styles.value, value === '' && styles.placeholder]}>{value || 'Pilih tanggal'}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, selected) => {
            setShow(Platform.OS === 'ios');
            if (event.type === 'set' && selected) {
              onChange(toKey(selected));
            }
          }}
        />
      )}
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
    minHeight: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  value: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  placeholder: {
    color: colors.ink38,
  },
});