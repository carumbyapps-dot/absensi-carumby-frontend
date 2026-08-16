import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { formatDateLong, LeaveBalance, LeaveRecord, LeaveType } from '@/types/leave';
import LeaveStatusBadge from '@/components/LeaveStatusBadge';

export default function CutiScreen() {
  const router = useRouter();
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balance, setBalance] = useState<LeaveBalance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, b, l] = await Promise.all([
        apiFetch<{ types: LeaveType[] }>('/api/leaves/types'),
        apiFetch<{ balance: LeaveBalance[] }>('/api/leaves/balance'),
        apiFetch<{ leaves: LeaveRecord[] }>('/api/leaves'),
      ]);
      setTypes(t.types);
      setBalance(b.balance);
      setLeaves(l.leaves);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const quotaTypes = balance.filter((b) => b.entitlement !== null);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.ink} />}
    >
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        onPress={() => router.push('/cuti-form')}
      >
        <Ionicons name="add" size={20} color={colors.bone} />
        <Text style={styles.ctaText}>Ajukan Cuti / Izin</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sisa Kuota {new Date().getFullYear()}</Text>
        {quotaTypes.length === 0 && !loading && (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Tidak ada kuota cuti</Text>
          </View>
        )}
        <View style={styles.quotaGrid}>
          {quotaTypes.map((b) => (
            <View key={b.typeId} style={styles.quotaItem}>
              <Text style={styles.quotaValue}>
                {b.remaining ?? 0}
                <Text style={styles.quotaUnit}> / {b.entitlement} hr</Text>
              </Text>
              <Text style={styles.quotaName}>{b.typeName}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Riwayat Pengajuan</Text>

        {loading && leaves.length === 0 ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.stateText}>Memuat pengajuan…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.ink38} />
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={load}>
              <Text style={styles.linkText}>Coba lagi</Text>
            </Pressable>
          </View>
        ) : leaves.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="calendar-clear-outline" size={22} color={colors.ink38} />
            <Text style={styles.stateText}>Belum ada pengajuan cuti</Text>
          </View>
        ) : (
          leaves.map((l) => (
            <View key={l.id} style={styles.leaveRow}>
              <View style={styles.leaveHead}>
                <Text style={styles.leaveType}>{l.typeName}</Text>
                <LeaveStatusBadge status={l.status} />
              </View>
              <Text style={styles.leaveDates}>
                {formatDateLong(l.startDate)} — {formatDateLong(l.endDate)} · {l.days} hari kerja
              </Text>
              <Text style={styles.leaveReason}>{l.reason}</Text>
              {l.adminNote && l.status !== 'pending' && (
                <Text style={styles.leaveNote}>Catatan admin: {l.adminNote}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  pressed: {
    opacity: 0.85,
  },
  ctaText: {
    ...typography.label,
    color: colors.bone,
    fontSize: 12,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  quotaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quotaItem: {
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
  },
  quotaValue: {
    fontFamily: fontFamily.black,
    fontSize: font.d3,
    color: colors.ink,
  },
  quotaUnit: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  quotaName: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
    marginTop: spacing.xs,
  },
  stateBox: {
    alignItems: 'center',
    gap: spacing.md,
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
  linkText: {
    ...typography.label,
    fontSize: 10,
    color: colors.red,
  },
  leaveRow: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  leaveHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveType: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  leaveDates: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    marginTop: spacing.sm,
  },
  leaveReason: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  leaveNote: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.batu,
    marginTop: spacing.sm,
  },
});
