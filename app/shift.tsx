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

interface ScheduleInfo {
  startTime: string;
  endTime: string;
}

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
  const [autoSource, setAutoSource] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<Record<string, ScheduleInfo>>({});

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const months = [
        { y: now.getFullYear(), m: now.getMonth() + 1 },
        now.getMonth() + 2 > 12
          ? { y: now.getFullYear() + 1, m: now.getMonth() + 2 - 12 }
          : { y: now.getFullYear(), m: now.getMonth() + 2 },
      ];
      const [mine, ...scheds] = await Promise.all([
        apiFetch<{ requests: ShiftRequestRecord[] }>('/api/shifts/requests'),
        ...months.map(({ y, m }) =>
          apiFetch<{ schedules: { date: string; startTime: string; endTime: string }[] }>(
            `/api/schedules/mine?year=${y}&month=${m}`,
          ),
        ),
      ]);
      setRequests(mine.requests);
      const map: Record<string, ScheduleInfo> = {};
      scheds.forEach((r) => r.schedules.forEach((s) => (map[s.date] = { startTime: s.startTime, endTime: s.endTime })));
      setSchedules(map);
      const today = toDateKey(new Date());
      setDate(today);
      applyAuto(today, map);
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const applyAuto = (key: string, map: Record<string, ScheduleInfo>) => {
    if (map[key]) {
      setStartTime(map[key].startTime);
      setEndTime(map[key].endTime);
      setAutoSource('Jam dari jadwal Anda pada tanggal ini');
      return;
    }
    const past = Object.keys(map)
      .filter((d) => d < key)
      .sort()
      .pop();
    if (past) {
      setStartTime(map[past].startTime);
      setEndTime(map[past].endTime);
      setAutoSource('Jam menyalin shift terakhir Anda — ubah bila perlu');
      return;
    }
    setStartTime('08:00');
    setEndTime('17:00');
    setAutoSource('Jam default 08:00–17:00 — ubah bila perlu');
  };

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
        <DateField
          label="Tanggal Shift"
          value={date}
          onChange={(key) => {
            setDate(key);
            applyAuto(key, schedules);
          }}
        />
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
              placeholder="00:00"
              placeholderTextColor={colors.ink38}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
        {autoSource !== '' && <Text style={styles.autoHint}>{autoSource}</Text>}
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
  autoHint: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.lumut,
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
