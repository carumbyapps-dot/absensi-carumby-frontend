import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import type { EmployeeRecord } from '@/types/leave';
import DateField from '@/components/DateField';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const REASON_PRESETS = ['Kendala perangkat', 'Kendala jaringan internet', 'Lupa absen'];

export default function AdminAbsenManualScreen() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'in' | 'out'>('in');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const e = await apiFetch<{ employees: EmployeeRecord[] }>('/api/employees');
      const active = e.employees.filter((emp) => emp.status === 'active');
      setEmployees(active);
      setSelectedId((prev) => prev ?? active[0]?.userId ?? null);
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!selectedId) {
      Alert.alert('Pilih karyawan', 'Pilih karyawan yang akan diinput absennya.');
      return;
    }
    if (!date || !TIME_RE.test(time)) {
      Alert.alert('Waktu tidak valid', 'Tanggal dan jam (HH:MM) wajib diisi dengan benar.');
      return;
    }
    const finalReason = `${reason}${note.trim() ? ` — ${note.trim()}` : ''}`.trim();
    if (!finalReason) {
      Alert.alert('Alasan wajib', 'Tulis alasan absen manual (mis. kendala jaringan).');
      return;
    }
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const timestamp = new Date(y, m - 1, d, hh, mm, 0).toISOString();
    setSending(true);
    try {
      const r = await apiFetch<{ message: string }>('/api/attendance/manual', {
        method: 'POST',
        body: { userId: selectedId, type, timestamp, note: finalReason },
      });
      Alert.alert('Tercatat', r.message);
      setDate('');
      setTime('');
      setReason('');
      setNote('');
    } catch (err) {
      Alert.alert('Gagal mencatat', getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Karyawan</Text>
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {employees.map((emp) => (
            <Pressable
              key={emp.userId}
              style={({ pressed }) => [styles.chip, selectedId === emp.userId && styles.chipActive, pressed && styles.pressed]}
              onPress={() => setSelectedId(emp.userId)}
            >
              <Text style={[styles.chipText, selectedId === emp.userId && styles.chipTextActive]}>{emp.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Text style={styles.sectionLabel}>Jenis Absen</Text>
      <View style={styles.toggleRow}>
        {(['in', 'out'] as const).map((t) => (
          <Pressable
            key={t}
            style={({ pressed }) => [styles.toggle, type === t && styles.toggleActive, pressed && styles.pressed]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
              {t === 'in' ? 'Absen Masuk' : 'Absen Keluar'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Waktu</Text>
      <DateField label="Tanggal" value={date} onChange={setDate} maximumDate={new Date()} />
      <TextInput
        style={styles.input}
        placeholder="Jam (HH:MM, mis. 07:55)"
        placeholderTextColor={colors.ink38}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        value={time}
        onChangeText={setTime}
      />

      <Text style={styles.sectionLabel}>Alasan</Text>
      <View style={styles.chipRow}>
        {REASON_PRESETS.map((r) => (
          <Pressable
            key={r}
            style={({ pressed }) => [styles.chip, reason === r && styles.chipActive, pressed && styles.pressed]}
            onPress={() => setReason(reason === r ? '' : r)}
          >
            <Text style={[styles.chipText, reason === r && styles.chipTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Catatan tambahan (opsional, mis. nomor tiket IT)"
        placeholderTextColor={colors.ink38}
        value={note}
        onChangeText={setNote}
        maxLength={200}
      />

      <Pressable style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]} onPress={submit} disabled={sending}>
        {sending ? (
          <ActivityIndicator color={colors.bone} size="small" />
        ) : (
          <>
            <Ionicons name="create-outline" size={16} color={colors.bone} />
            <Text style={styles.submitText}>Catat Absen Manual</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.hint}>
        Absen manual diberi label "Manual" di riwayat karyawan, tetap dihitung dalam payroll, dan status
        tepat waktu/terlambat dihitung seperti biasa. Waktu tidak boleh di masa depan.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  stateBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xl,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  chipText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  chipTextActive: {
    color: colors.bone,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggle: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingVertical: spacing.md,
  },
  toggleActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  toggleText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  toggleTextActive: {
    color: colors.bone,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  submitText: {
    ...typography.label,
    fontSize: 12,
    color: colors.bone,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});