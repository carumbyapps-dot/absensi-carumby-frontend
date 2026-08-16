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
import { downloadPayrollSlip } from '@/lib/download';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import {
  formatRupiah,
  MONTH_LABEL,
  periodLabel,
  totalDeduction,
  type PayrollItem,
  type PayrollPreviewResponse,
  type PayrollRecord,
} from '@/types/payroll';

export default function AdminPayrollScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [includeThr, setIncludeThr] = useState(false);
  const [manualDeduction, setManualDeduction] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [preview, setPreview] = useState<PayrollPreviewResponse | null>(null);
  const [saved, setSaved] = useState<PayrollRecord[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const runInput = {
    year,
    month,
    includeThr,
    manualDeduction: manualDeduction ? Number(manualDeduction) : undefined,
    manualDeductionNote: manualNote.trim() || undefined,
  };

  const loadSaved = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const res = await apiFetch<{ payrolls: PayrollRecord[] }>(`/api/payroll?year=${year}&month=${month}`);
      setSaved(res.payrolls);
    } catch (err) {
      Alert.alert('Gagal memuat rekap', getErrorMessage(err));
    } finally {
      setLoadingSaved(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const compute = async () => {
    setLoadingPreview(true);
    setPreview(null);
    try {
      const res = await apiFetch<PayrollPreviewResponse>('/api/payroll/preview', { method: 'POST', body: runInput });
      setPreview(res);
    } catch (err) {
      Alert.alert('Gagal menghitung', getErrorMessage(err));
    } finally {
      setLoadingPreview(false);
    }
  };

  const run = async () => {
    if (!preview || preview.items.length === 0) return;
    Alert.alert('Simpan Payroll?', `Payroll ${periodLabel(year, month)} akan disimpan final untuk ${preview.items.length} karyawan. Setelah ini tidak bisa diubah tanpa menghapus dulu.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Simpan',
        style: 'destructive',
        onPress: async () => {
          setRunning(true);
          try {
            const res = await apiFetch<{ message: string }>('/api/payroll/run', { method: 'POST', body: runInput });
            Alert.alert('Tersimpan', res.message);
            setPreview(null);
            await loadSaved();
          } catch (err) {
            Alert.alert('Gagal menyimpan', getErrorMessage(err));
          } finally {
            setRunning(false);
          }
        },
      },
    ]);
  };

  const remove = (id: number) => {
    Alert.alert('Hapus slip?', 'Slip akan dihapus agar payroll periode ini bisa dihitung ulang.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/payroll/${id}`, { method: 'DELETE' });
            await loadSaved();
          } catch (err) {
            Alert.alert('Gagal menghapus', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const download = async (id: number) => {
    const ok = await downloadPayrollSlip(id);
    if (!ok) Alert.alert('Belum tersedia', 'Unduhan PDF saat ini hanya tersedia di versi web.');
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

      <Text style={styles.sectionLabel}>Opsi</Text>
      <View style={styles.card}>
        <Pressable style={styles.optionRow} onPress={() => setIncludeThr((v) => !v)}>
          <View style={[styles.checkbox, includeThr && styles.checkboxOn]}>
            {includeThr && <Ionicons name="checkmark" size={14} color={colors.bone} />}
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Sertakan THR</Text>
            <Text style={styles.optionSub}>THR proporsional (masa kerja/12) ditambahkan ke gaji bulan ini</Text>
          </View>
        </Pressable>
        <Text style={styles.fieldLabel}>Potongan Manual (berlaku untuk semua karyawan)</Text>
        <TextInput
          style={styles.input}
          placeholder="Rp, kosongkan bila tidak ada"
          placeholderTextColor={colors.ink38}
          keyboardType="number-pad"
          value={manualDeduction}
          onChangeText={(v) => setManualDeduction(v.replace(/[^\d]/g, ''))}
        />
        <TextInput
          style={styles.input}
          placeholder="Catatan potongan (mis. kasbon)"
          placeholderTextColor={colors.ink38}
          value={manualNote}
          onChangeText={setManualNote}
        />
      </View>

      <Pressable style={({ pressed }) => [styles.computeBtn, pressed && styles.pressed]} onPress={compute} disabled={loadingPreview}>
        {loadingPreview ? <ActivityIndicator color={colors.bone} size="small" /> : <Text style={styles.computeBtnText}>Hitung Gaji</Text>}
      </Pressable>

      {preview && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Hasil Perhitungan</Text>
          {preview.items.map((item) => (
            <PayrollRowItem key={item.userId} item={item} />
          ))}
          {preview.skipped.length > 0 && (
            <View style={styles.skippedBox}>
              <Text style={styles.skippedTitle}>Dilewati ({preview.skipped.length})</Text>
              {preview.skipped.map((s) => (
                <Text key={s.userId} style={styles.skippedText}>
                  • {s.userName} — {s.reason}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.summaryBox}>
            <SummaryRow label="Karyawan" value={String(preview.summary.employeeCount)} />
            <SummaryRow label="Total bruto" value={formatRupiah(preview.summary.totalGross)} />
            <SummaryRow label="Total BPJS" value={formatRupiah(preview.summary.totalBpjs)} />
            <SummaryRow label="Total PPh 21" value={formatRupiah(preview.summary.totalPph21)} />
            <SummaryRow label="Total bersih" value={formatRupiah(preview.summary.totalNet)} strong />
          </View>
          <Pressable
            style={({ pressed }) => [styles.runBtn, pressed && styles.pressed]}
            onPress={run}
            disabled={running || preview.items.length === 0}
          >
            {running ? <ActivityIndicator color={colors.bone} size="small" /> : <Text style={styles.runBtnText}>Simpan Payroll</Text>}
          </Pressable>
        </View>
      )}

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Rekap {periodLabel(year, month)} ({saved.length})</Text>
        {loadingSaved ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : saved.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Belum ada slip untuk periode ini.</Text>
          </View>
        ) : (
          saved.map((p) => (
            <View key={p.id} style={styles.slipCard}>
              <View style={styles.slipHead}>
                <View style={styles.slipInfo}>
                  <Text style={styles.slipName}>{p.userName}</Text>
                  <Text style={styles.slipMeta}>
                    {p.divisionName ?? '-'} · Hadir {p.presentDays}/{p.workDays}
                    {p.thrAmount > 0 ? ' · +THR' : ''}
                  </Text>
                </View>
                <Text style={styles.slipNet}>{formatRupiah(p.netIncome)}</Text>
              </View>
              <View style={styles.slipActions}>
                <Pressable style={({ pressed }) => [styles.slipBtn, pressed && styles.pressed]} onPress={() => download(p.id)}>
                  <Ionicons name="download-outline" size={14} color={colors.ink} />
                  <Text style={styles.slipBtnText}>PDF</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.slipBtn, pressed && styles.pressed]} onPress={() => remove(p.id)}>
                  <Ionicons name="trash-outline" size={14} color={colors.red} />
                  <Text style={[styles.slipBtnText, styles.slipBtnDanger]}>Hapus</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function PayrollRowItem({ item }: { item: PayrollItem }) {
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHead}>
        <View style={styles.slipInfo}>
          <Text style={styles.slipName}>{item.userName}</Text>
          <Text style={styles.slipMeta}>
            Hadir {item.presentDays}/{item.workDays} · Cuti {item.paidLeaveDays} · Tanpa bayar {item.unpaidLeaveDays} · Alpa {item.absentDays}
            {item.thrAmount > 0 ? ` · THR ${formatRupiah(item.thrAmount)}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.resultRows}>
        <SummaryRow label="Bruto" value={formatRupiah(item.grossSalary)} />
        <SummaryRow label="Potongan" value={`− ${formatRupiah(totalDeduction(item))}`} />
        <SummaryRow label="Bersih" value={formatRupiah(item.netIncome)} strong />
      </View>
    </View>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
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
    marginTop: spacing.lg,
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
  card: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ink38,
  },
  checkboxOn: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
  },
  optionSub: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  fieldLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  computeBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  computeBtnText: {
    ...typography.label,
    fontSize: 12,
    color: colors.bone,
  },
  runBtn: {
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  runBtnText: {
    ...typography.label,
    fontSize: 12,
    color: colors.bone,
  },
  sectionBlock: {
    marginTop: spacing.xl,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: colors.ink12,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slipCard: {
    borderWidth: 1,
    borderColor: colors.ink12,
    marginBottom: spacing.md,
  },
  slipHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  slipInfo: {
    flex: 1,
    gap: 2,
  },
  slipName: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  slipMeta: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  slipNet: {
    fontFamily: fontFamily.black,
    fontSize: font.body,
    color: colors.ink,
  },
  slipActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
  },
  slipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  slipBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  slipBtnDanger: {
    color: colors.red,
  },
  resultRows: {
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  skippedBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  skippedTitle: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  skippedText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  summaryBox: {
    backgroundColor: colors.ink,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLabel: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.bone55,
  },
  summaryValue: {
    fontFamily: fontFamily.semibold,
    fontSize: font.caption,
    color: colors.bone,
  },
  summaryStrong: {
    fontFamily: fontFamily.black,
    color: colors.bone,
  },
  stateBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xl,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  pressed: {
    opacity: 0.8,
  },
});