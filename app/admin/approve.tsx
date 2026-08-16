import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { formatDateLong, LeaveRecord } from '@/types/leave';

export default function AdminApproveScreen() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ leaves: LeaveRecord[] }>('/api/leaves/all?status=pending');
      setLeaves(res.leaves);
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
      await apiFetch(`/api/leaves/${id}/decide`, { method: 'PATCH', body: { decision } });
      setLeaves((prev) => prev.filter((l) => l.id !== id));
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
      <Text style={styles.sectionLabel}>Menunggu Keputusan ({leaves.length})</Text>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : leaves.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Tidak ada pengajuan yang menunggu</Text>
        </View>
      ) : (
        leaves.map((l) => (
          <View key={l.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.name}>{l.userName}</Text>
              <Text style={styles.type}>{l.typeName}</Text>
            </View>
            <Text style={styles.dates}>
              {formatDateLong(l.startDate)} — {formatDateLong(l.endDate)} · {l.days} hari kerja
            </Text>
            <Text style={styles.reason}>{l.reason}</Text>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.btnApprove, pressed && styles.pressed]}
                disabled={busyId !== null}
                onPress={() => decide(l.id, 'approved')}
              >
                {busyId === l.id ? (
                  <ActivityIndicator color={colors.bone} size="small" />
                ) : (
                  <Text style={styles.btnApproveText}>Setujui</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btnReject, pressed && styles.pressed]}
                disabled={busyId !== null}
                onPress={() => {
                  Alert.alert('Tolak pengajuan?', `${l.userName} · ${l.typeName}`, [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Tolak', style: 'destructive', onPress: () => decide(l.id, 'rejected') },
                  ]);
                }}
              >
                <Text style={styles.btnRejectText}>Tolak</Text>
              </Pressable>
            </View>
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
    marginBottom: spacing.md,
  },
  stateBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xxl,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.label,
    fontSize: 13,
    color: colors.ink,
  },
  type: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  dates: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    marginTop: spacing.sm,
  },
  reason: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btnApprove: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
  btnApproveText: {
    ...typography.label,
    fontSize: 11,
    color: colors.bone,
  },
  btnReject: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.red,
    paddingVertical: spacing.md,
  },
  btnRejectText: {
    ...typography.label,
    fontSize: 11,
    color: colors.red,
  },
});