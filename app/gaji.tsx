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
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { downloadPayrollSlip } from '@/lib/download';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { formatRupiah, periodLabel, totalDeduction, type PayrollRecord } from '@/types/payroll';

export default function GajiScreen() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ payrolls: PayrollRecord[] }>('/api/payroll/mine');
      setPayrolls(res.payrolls);
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (id: number) => {
    setDownloading(id);
    try {
      const ok = await downloadPayrollSlip(id);
      if (!ok) {
        Alert.alert('Belum tersedia', 'Unduhan PDF saat ini hanya tersedia di versi web.');
      }
    } finally {
      setDownloading(null);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading && payrolls.length === 0} onRefresh={load} tintColor={colors.ink} />}
    >
      <Text style={styles.sectionLabel}>Slip Gaji ({payrolls.length})</Text>

      {loading && payrolls.length === 0 ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : payrolls.length === 0 ? (
        <View style={styles.stateBox}>
          <Ionicons name="wallet-outline" size={22} color={colors.ink38} />
          <Text style={styles.stateText}>Belum ada slip gaji.</Text>
          <Text style={styles.stateText}>Slip muncul setelah admin menjalankan payroll bulan berjalan.</Text>
        </View>
      ) : (
        payrolls.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardInfo}>
                <Text style={styles.period}>{periodLabel(p.periodYear, p.periodMonth)}</Text>
                <Text style={styles.meta}>
                  Hadir {p.presentDays}/{p.workDays} hari · Cuti {p.paidLeaveDays} · Alpa {p.absentDays}
                </Text>
                {p.thrAmount > 0 && <Text style={styles.meta}>Termasuk THR {formatRupiah(p.thrAmount)}</Text>}
              </View>
              <Text style={styles.net}>{formatRupiah(p.netIncome)}</Text>
            </View>

            <View style={styles.cardBody}>
              <Row label="Gaji pokok + tunjangan" value={formatRupiah(p.grossSalary - p.thrAmount)} />
              <Row label="THR" value={formatRupiah(p.thrAmount)} />
              <Row label="Potongan (BPJS, PPh 21, dll.)" value={`− ${formatRupiah(totalDeduction(p))}`} />
              <Row label="Gaji bersih" value={formatRupiah(p.netIncome)} strong />
            </View>

            <Pressable
              style={({ pressed }) => [styles.downloadBtn, pressed && styles.pressed]}
              onPress={() => download(p.id)}
              disabled={downloading === p.id}
            >
              {downloading === p.id ? (
                <ActivityIndicator color={colors.bone} size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color={colors.bone} />
                  <Text style={styles.downloadText}>Unduh Slip PDF</Text>
                </>
              )}
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrong]}>{value}</Text>
    </View>
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
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: colors.ink12,
    marginBottom: spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  period: {
    ...typography.label,
    fontSize: 13,
    color: colors.ink,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  net: {
    fontFamily: fontFamily.black,
    fontSize: font.heading,
    color: colors.ink,
    letterSpacing: 0.4,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  rowValue: {
    fontFamily: fontFamily.semibold,
    fontSize: font.caption,
    color: colors.ink,
  },
  rowStrong: {
    fontFamily: fontFamily.black,
    color: colors.ink,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    paddingVertical: spacing.md,
  },
  downloadText: {
    ...typography.label,
    fontSize: 11,
    color: colors.bone,
  },
  pressed: {
    opacity: 0.8,
  },
});