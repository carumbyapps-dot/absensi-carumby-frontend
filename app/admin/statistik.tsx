import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, fontFamily, numerals, spacing, typography } from '@/theme';
import { MONTH_LABEL } from '@/types/payroll';

interface StatsDivision {
  divisionId: number | null;
  name: string;
  active: number;
  checkedIn: number;
  lateIn: number;
}

interface StatsDay {
  date: string;
  checkedIn: number;
  lateIn: number;
}

interface AdminStats {
  date: string;
  summary: {
    activeEmployees: number;
    checkedIn: number;
    lateIn: number;
    checkedOut: number;
    notCheckedIn: number;
  };
  perDivision: StatsDivision[];
  last7Days: StatsDay[];
  pendingLeaves: number;
}

const DAY_LABEL = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatTanggal(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTH_LABEL[m - 1]} ${y}`;
}

function weekdayOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return DAY_LABEL[new Date(y, m - 1, d).getDay()];
}

export default function AdminStatistikScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminStats>('/api/admin/stats');
      setStats(res);
    } catch (err) {
      Alert.alert('Gagal memuat statistik', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.red} size="small" />
      </View>
    );
  }

  const maxDay = Math.max(1, ...(stats?.last7Days ?? []).map((d) => d.checkedIn));

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionLabel}>Statistik</Text>
          <Text style={styles.dateText}>{stats ? formatTanggal(stats.date) : ''}</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]} onPress={load}>
          <Text style={styles.refreshText}>Muat Ulang</Text>
        </Pressable>
      </View>

      {stats && (
        <>
          <View style={styles.grid}>
            <View style={[styles.cell, styles.cellBorderRight, styles.cellBorderBottom]}>
              <Text style={styles.cellValue}>{stats.summary.checkedIn}</Text>
              <Text style={styles.cellLabel}>Hadir</Text>
            </View>
            <View style={[styles.cell, styles.cellBorderBottom]}>
              <Text style={[styles.cellValue, styles.cellValueRed]}>{stats.summary.lateIn}</Text>
              <Text style={styles.cellLabel}>Terlambat</Text>
            </View>
            <View style={[styles.cell, styles.cellBorderRight]}>
              <Text style={styles.cellValue}>{stats.summary.notCheckedIn}</Text>
              <Text style={styles.cellLabel}>Belum Absen</Text>
            </View>
            <View style={styles.cell}>
              <Text style={[styles.cellValue, styles.cellValueLumut]}>{stats.summary.checkedOut}</Text>
              <Text style={styles.cellLabel}>Sudah Pulang</Text>
            </View>
          </View>
          <Text style={styles.gridCaption}>
            DARI {stats.summary.activeEmployees} KARYAWAN AKTIF
          </Text>

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Kehadiran per Divisi</Text>
          {stats.perDivision.map((div) => {
            const pct = div.active > 0 ? Math.round((div.checkedIn / div.active) * 100) : 0;
            return (
              <View key={div.divisionId ?? 'null'} style={styles.divRow}>
                <View style={styles.divHeader}>
                  <Text style={styles.divName} numberOfLines={1}>
                    {div.name}
                  </Text>
                  <Text style={styles.divCount}>
                    {div.checkedIn}/{div.active}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>7 Hari Terakhir</Text>
          <View style={styles.chartRow}>
            {stats.last7Days.map((d) => {
              const isToday = d.date === stats.date;
              const height = d.checkedIn > 0 ? Math.max(2, Math.round((d.checkedIn / maxDay) * 80)) : 2;
              return (
                <View key={d.date} style={styles.chartCol}>
                  <Text style={styles.chartValue}>{d.checkedIn}</Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        { height },
                        isToday ? styles.chartBarToday : styles.chartBarPast,
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                    {weekdayOf(d.date)}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Cuti & Izin</Text>
          <View style={styles.leaveRow}>
            <View>
              <Text style={styles.leaveCount}>{stats.pendingLeaves}</Text>
              <Text style={styles.leaveText}>Pengajuan menunggu keputusan</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}
              onPress={() => router.push('/admin/approve')}
            >
              <Text style={styles.reviewBtnText}>Tinjau</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
  },
  sectionSpacing: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.ink60,
    marginTop: 2,
  },
  refreshBtn: {
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  refreshText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ink12,
  },
  cell: {
    width: '50%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: colors.ink12,
  },
  cellBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  cellValue: {
    ...typography.d3,
    ...numerals,
    color: colors.ink,
    fontSize: 26,
  },
  cellValueRed: {
    color: colors.red,
  },
  cellValueLumut: {
    color: colors.lumut,
  },
  cellLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
    marginTop: spacing.xs,
  },
  gridCaption: {
    ...typography.label,
    fontSize: 9,
    color: colors.ink60,
    marginTop: spacing.sm,
  },
  divRow: {
    marginBottom: spacing.md,
  },
  divHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  divName: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  divCount: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    color: colors.ink60,
    ...numerals,
  },
  track: {
    height: 6,
    backgroundColor: colors.ink12,
  },
  fill: {
    height: 6,
    backgroundColor: colors.lumut,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  chartValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    color: colors.ink60,
    ...numerals,
  },
  chartTrack: {
    width: '100%',
    maxWidth: 32,
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '70%',
  },
  chartBarPast: {
    backgroundColor: colors.lumut,
  },
  chartBarToday: {
    backgroundColor: colors.red,
  },
  chartLabel: {
    ...typography.label,
    fontSize: 8,
    color: colors.ink60,
  },
  chartLabelToday: {
    color: colors.red,
  },
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
  },
  leaveCount: {
    ...typography.d3,
    ...numerals,
    color: colors.ink,
    fontSize: 26,
  },
  leaveText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.ink60,
    marginTop: 2,
  },
  reviewBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reviewBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.bone,
  },
});
