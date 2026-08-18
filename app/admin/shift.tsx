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
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, fontFamily, spacing, typography } from '@/theme';
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

function formatTanggal(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTH_LABEL[m - 1]} ${y}`;
}

export default function AdminShiftScreen() {
  const [pending, setPending] = useState<ShiftRequestRecord[]>([]);
  const [history, setHistory] = useState<ShiftRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([
        apiFetch<{ requests: ShiftRequestRecord[] }>('/api/shifts/requests/all?status=pending'),
        apiFetch<{ requests: ShiftRequestRecord[] }>('/api/shifts/requests/all'),
      ]);
      setPending(p.requests);
      setHistory(h.requests.filter((r) => r.status !== 'pending').slice(0, 20));
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: number, decision: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      await apiFetch(`/api/shifts/requests/${id}/decide`, {
        method: 'PATCH',
        body: { decision, adminNote: note.trim() || undefined },
      });
      setNote('');
      setPending((prev) => prev.filter((r) => r.id !== id));
      await load();
    } catch (err) {
      Alert.alert('Gagal memutuskan', getErrorMessage(err));
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
      <Text style={styles.sectionLabel}>Menunggu Keputusan ({pending.length})</Text>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : pending.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Tidak ada pengajuan shift yang menunggu</Text>
        </View>
      ) : (
        pending.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.name}>{r.userName}</Text>
              <Text style={styles.date}>{formatTanggal(r.date)}</Text>
            </View>
            <Text style={styles.time}>
              {r.startTime} — {r.endTime}
            </Text>
            <Text style={styles.reason}>{r.reason}</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Catatan admin (opsional)"
              placeholderTextColor={colors.ink38}
            />
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.btnApprove, pressed && styles.pressed]}
                disabled={busyId !== null}
                onPress={() => decide(r.id, 'approved')}
              >
                {busyId === r.id ? (
                  <ActivityIndicator color={colors.bone} size="small" />
                ) : (
                  <Text style={styles.btnApproveText}>Setujui</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btnReject, pressed && styles.pressed]}
                disabled={busyId !== null}
                onPress={() => {
                  Alert.alert('Tolak pengajuan?', `${r.userName} · ${formatTanggal(r.date)} · ${r.startTime}—${r.endTime}`, [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Tolak', style: 'destructive', onPress: () => decide(r.id, 'rejected') },
                  ]);
                }}
              >
                <Text style={styles.btnRejectText}>Tolak</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Riwayat Terbaru</Text>
      {history.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Belum ada riwayat keputusan</Text>
        </View>
      ) : (
        history.map((r) => (
          <View key={r.id} style={styles.historyRow}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyName}>{r.userName}</Text>
              <Text style={styles.historyMeta}>
                {formatTanggal(r.date)} · {r.startTime}—{r.endTime}
              </Text>
            </View>
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
    marginBottom: spacing.sm,
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
    gap: spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.ink60,
  },
  time: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  reason: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.ink60,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnApprove: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  btnApproveText: {
    ...typography.label,
    fontSize: 11,
    color: colors.bone,
  },
  btnReject: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.red,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  btnRejectText: {
    ...typography.label,
    fontSize: 11,
    color: colors.red,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
    paddingVertical: spacing.md,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyName: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
  },
  historyMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.ink60,
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
});
