import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadCsv } from '@/lib/export';
import { colors, fontFamily, spacing, typography } from '@/theme';
import { MONTH_LABEL } from '@/types/payroll';

export default function AdminRekapScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const doExport = async () => {
    const ok = await downloadCsv(`/api/attendance/export?year=${year}&month=${month}`);
    if (ok === null) {
      Alert.alert('Gagal mengekspor', 'Tidak dapat mengambil data.');
    } else if (!ok) {
      Alert.alert('CSV disalin', 'CSV disalin ke clipboard — tempel di Excel/Sheets.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionLabel}>Periode</Text>
      <View style={styles.yearRow}>
        <Pressable style={({ pressed }) => [styles.yearBtn, pressed && styles.pressed]} onPress={() => setYear((y) => y - 1)}>
          <Ionicons name="remove" size={16} color={colors.ink} />
        </Pressable>
        <Text style={styles.yearText}>{year}</Text>
        <Pressable style={({ pressed }) => [styles.yearBtn, pressed && styles.pressed]} onPress={() => setYear((y) => y + 1)}>
          <Ionicons name="add" size={16} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.chipRow}>
        {MONTH_LABEL.map((label, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [styles.chip, month === i + 1 && styles.chipActive, pressed && styles.pressed]}
            onPress={() => setMonth(i + 1)}
          >
            <Text style={[styles.chipText, month === i + 1 && styles.chipTextActive]}>{label.slice(0, 3)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Rekap Absensi {MONTH_LABEL[month - 1]} {year}</Text>
        <Text style={styles.infoText}>
          CSV berisi kolom: nama, email, divisi, jabatan, tanggal, jam masuk, jam keluar, status masuk, status keluar.
          Satu baris per karyawan per hari absen.
        </Text>
      </View>

      <Pressable style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]} onPress={doExport}>
        <Ionicons name="share-outline" size={16} color={colors.bone} />
        <Text style={styles.exportBtnText}>Export Rekap Absensi (CSV)</Text>
      </Pressable>
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
    marginBottom: spacing.sm,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  yearBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ink12,
  },
  yearText: {
    ...typography.d3,
    color: colors.ink,
    fontSize: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minWidth: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  chipText: {
    ...typography.label,
    fontSize: 9,
    color: colors.ink60,
  },
  chipTextActive: {
    color: colors.bone,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  infoTitle: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.ink60,
    lineHeight: 18,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  exportBtnText: {
    ...typography.label,
    fontSize: 12,
    color: colors.bone,
  },
  pressed: {
    opacity: 0.8,
  },
});