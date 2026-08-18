import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiFetch, getErrorMessage, toDateKey } from '@/lib/api';
import { colors, fontFamily, spacing, typography } from '@/theme';
import DateField from '@/components/DateField';
import { MONTH_LABEL } from '@/types/payroll';

type ShiftStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface ShiftRequestRecord {
  id: number;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: ShiftStatus;
  adminNote: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<ShiftStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

const SHIFT_PRESETS = [
  { label: '08:00 – 17:00', start: '08:00', end: '17:00' },
  { label: '09:00 – 18:00', start: '09:00', end: '18:00' },
  { label: '13:00 – 21:00', start: '13:00', end: '21:00' },
  { label: '19:00 – 00:00', start: '19:00', end: '00:00' },
];

function formatTanggal(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTH_LABEL[m - 1]} ${y}`;
}

export default function ShiftScreen() {
  const [requests, setRequests] = useState<ShiftRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ requests: ShiftRequestRecord[] }>('/api/shifts/requests');
      setRequests(res.requests);
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
    if (!date || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      Alert.alert('Form belum lengkap', 'Isi tanggal dan jam shift (HH:MM)');
      return;
    }
    if (reason.trim().length < 5) {
      Alert.alert('Form belum lengkap', 'Alasan minimal 5 karakter');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/shifts/requests', {
        method: 'POST',
        body: { date, startTime, endTime, reason: reason.trim() },
      });
      Alert.alert('Berhasil', 'Pengajuan shift terkirim, menunggu persetujuan admin');
      setDate('');
      setStartTime('');
      setEndTime('');
      setReason('');
      await load();
    } catch (err) {
      Alert.alert('Pengajuan gagal', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: number) => {
    setBusyId(id);
    try {
      await apiFetch(`/api/shifts/requests/${id}/cancel`, { method: 'POST' });
      await load();
    } catch (err) {
      Alert.alert('Gagal membatalkan', getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.ink} />}
    >
      <Text style={styles.sectionLabel}>Ajukan Shift</Text>
      <View style={styles.form}>
        <DateField label="Tanggal Shift" value={date} onChange={setDate} />
        <View style={styles.presetRow}>
          {SHIFT_PRESETS.map((p) => {
            const active = startTime === p.start && endTime === p.end;
            return (
              <Pressable
                key={p.label}
                style={({ pressed }) => [styles.preset, active && styles.presetActive, pressed && styles.pressed]}
                onPress={() => {
                  setStartTime(p.start);
                  setEndTime(p.end);
                }}
              >
                <Text style={[styles.presetText, active && styles.presetTextActive]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={styles.fieldLabel}>Jam Mulai</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:00"
              placeholderTextColor={colors.ink38}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.timeCol}>
            <Text style={styles.fieldLabel}>Jam Selesai</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="17:00"
              placeholderTextColor={colors.ink38}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
        <Text style={styles.fieldLabel}>Alasan</Text>
        <TextInput
          style={[styles.input, styles.reasonInput]}
          value={reason}
          onChangeText={setReason}
          placeholder="Kenapa perlu shift ini? (min. 5 karakter)"
          placeholderTextColor={colors.ink38}
          multiline
        />
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
          disabled={submitting}
          onPress={submit}
        >
          {submitting ? (
            <ActivityIndicator color={colors.bone} size="small" />
          ) : (
            <Text style={styles.submitText}>Kirim Pengajuan</Text>
          )}
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Riwayat Pengajuan ({requests.length})</Text>
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Belum ada pengajuan shift</Text>
        </View>
      ) : (
        requests.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardDate}>{formatTanggal(r.date)}</Text>
              <Text
                style={[
                  styles.status,
                  r.status === 'approved' && styles.statusApproved,
                  r.status === 'rejected' && styles.statusRejected,
                ]}
              >
                {STATUS_LABEL[r.status]}
              </Text>
            </View>
            <Text style={styles.cardTime}>
              {r.startTime} — {r.endTime}
            </Text>
            <Text style={styles.cardReason}>{r.reason}</Text>
            {r.adminNote ? <Text style={styles.cardNote}>Catatan admin: {r.adminNote}</Text> : null}
            {r.status === 'pending' && (
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                disabled={busyId !== null}
                onPress={() => {
                  Alert.alert('Batalkan pengajuan?', `${formatTanggal(r.date)} · ${r.startTime}—${r.endTime}`, [
                    { text: 'Tutup', style: 'cancel' },
                    { text: 'Batalkan', style: 'destructive', onPress: () => cancel(r.id) },
                  ]);
                }}
              >
                {busyId === r.id ? (
                  <ActivityIndicator color={colors.red} size="small" />
                ) : (
                  <Text style={styles.cancelText}>Batalkan</Text>
                )}
              </Pressable>
            )}
          </View>
        ))
      )}
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
  },
  sectionSpacing: {
    marginTop: spacing.xl,
  },
  form: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preset: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  presetActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  presetText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  presetTextActive: {
    color: colors.bone,
  },
  fieldLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
    marginBottom: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeCol: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.ink,
  },
  reasonInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.red,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  submitText: {
    ...typography.label,
    fontSize: 12,
    color: colors.bone,
  },
  pressed: {
    opacity: 0.8,
  },
  stateBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.ink60,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  status: {
    ...typography.label,
    fontSize: 9,
    color: colors.batu,
  },
  statusApproved: {
    color: colors.lumut,
  },
  statusRejected: {
    color: colors.red,
  },
  cardTime: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  cardReason: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.ink60,
    lineHeight: 18,
  },
  cardNote: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.lumut,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.red,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelText: {
    ...typography.label,
    fontSize: 10,
    color: colors.red,
  },
});
