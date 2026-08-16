import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { downloadCsv, importCsv } from '@/lib/export';
import CsvImportModal from '@/components/CsvImportModal';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import type { EmployeeRecord } from '@/types/leave';
import { MONTH_LABEL } from '@/types/payroll';
import { WEEKDAY_SHORT, type WorkScheduleRecord } from '@/types/schedule';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AdminJadwalScreen() {
  const now = new Date();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [schedules, setSchedules] = useState<WorkScheduleRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importVisible, setImportVisible] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const loadEmployees = useCallback(async () => {
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

  const loadSchedules = useCallback(async () => {
    if (!selectedId) {
      setSchedules([]);
      return;
    }
    try {
      const r = await apiFetch<{ schedules: WorkScheduleRecord[] }>(
        `/api/schedules?userId=${selectedId}&year=${year}&month=${month}`,
      );
      setSchedules(r.schedules);
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    }
  }, [selectedId, year, month]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const days = useMemo(() => {
    const count = new Date(year, month, 0).getDate();
    const first = new Date(year, month - 1, 1);
    const offset = (first.getDay() + 6) % 7;
    return { count, offset };
  }, [year, month]);

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, WorkScheduleRecord>();
    for (const s of schedules) map.set(s.date, s);
    return map;
  }, [schedules]);

  const openDay = (day: number) => {
    const key = dateKey(year, month, day);
    setSelectedDate(key);
    const s = scheduleByDate.get(key);
    setStartTime(s?.startTime ?? '');
    setEndTime(s?.endTime ?? '');
  };

  const save = async () => {
    if (!selectedId || !selectedDate) return;
    if (!TIME_RE.test(startTime)) {
      Alert.alert('Jam tidak valid', 'Jam mulai harus format HH:MM 24 jam (mis. 13:00).');
      return;
    }
    if (!TIME_RE.test(endTime)) {
      Alert.alert('Jam tidak valid', 'Jam selesai harus format HH:MM 24 jam (mis. 21:00).');
      return;
    }
    if (startTime >= endTime) {
      Alert.alert('Jam tidak valid', 'Jam selesai harus setelah jam mulai.');
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/schedules/${selectedId}`, {
        method: 'PUT',
        body: { date: selectedDate, startTime, endTime },
      });
      setSelectedDate(null);
      setStartTime('');
      setEndTime('');
      await loadSchedules();
    } catch (err) {
      Alert.alert('Gagal menyimpan', getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!selectedId || !selectedDate) return;
    Alert.alert('Hapus jadwal?', `Jadwal ${selectedDate} akan dihapus dan kembali ke jam kerja standar.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await apiFetch(`/api/schedules/${selectedId}/${selectedDate}`, { method: 'DELETE' });
            setSelectedDate(null);
            setStartTime('');
            setEndTime('');
            await loadSchedules();
          } catch (err) {
            Alert.alert('Gagal menghapus', getErrorMessage(err));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const existing = selectedDate ? scheduleByDate.get(selectedDate) : null;

  const doImport = async (csv: string) => {
    if (!selectedId) return;
    setImportBusy(true);
    try {
      const res = await importCsv('/api/schedules/import', { userId: selectedId, csv });
      Alert.alert('Impor selesai', res?.message ?? '');
      setImportVisible(false);
      await loadSchedules();
    } catch (err) {
      Alert.alert('Impor gagal', getErrorMessage(err));
    } finally {
      setImportBusy(false);
    }
  };

  const doExport = async () => {
    if (!selectedId) return;
    const ok = await downloadCsv(`/api/schedules/export?userId=${selectedId}&year=${year}&month=${month}`);
    if (ok === null) {
      Alert.alert('Gagal mengekspor', 'Tidak dapat mengambil data.');
    } else if (!ok) {
      Alert.alert('CSV disalin', 'CSV disalin ke clipboard — tempel di Excel/Sheets.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionLabel}>Karyawan</Text>
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.employeeRow}>
          {employees.map((emp) => (
            <Pressable
              key={emp.userId}
              style={({ pressed }) => [styles.employeeChip, selectedId === emp.userId && styles.employeeChipActive, pressed && styles.pressed]}
              onPress={() => setSelectedId(emp.userId)}
            >
              <Text style={[styles.employeeChipText, selectedId === emp.userId && styles.employeeChipTextActive]}>
                {emp.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

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

      <View style={styles.ioRow}>
        <Pressable style={({ pressed }) => [styles.ioBtn, pressed && styles.pressed]} onPress={() => setImportVisible(true)} disabled={!selectedId}>
          <Ionicons name="download-outline" size={14} color={colors.ink} />
          <Text style={styles.ioBtnText}>Import CSV</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.ioBtn, pressed && styles.pressed]} onPress={doExport} disabled={!selectedId}>
          <Ionicons name="share-outline" size={14} color={colors.ink} />
          <Text style={styles.ioBtnText}>Export CSV</Text>
        </Pressable>
      </View>

      {selectedDate && (
        <View style={styles.editBox}>
          <Text style={styles.editTitle}>Jadwal {selectedDate}{existing ? ' (ubah)' : ' (baru)'}</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Jam Mulai</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                placeholderTextColor={colors.ink38}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Jam Selesai</Text>
              <TextInput
                style={styles.input}
                placeholder="17:00"
                placeholderTextColor={colors.ink38}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>
          <View style={styles.editActions}>
            {existing && (
              <Pressable style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]} onPress={remove} disabled={busy}>
                <Ionicons name="trash-outline" size={14} color={colors.red} />
                <Text style={styles.removeBtnText}>Hapus</Text>
              </Pressable>
            )}
            <Pressable style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]} onPress={save} disabled={busy || !selectedId}>
              {busy ? <ActivityIndicator color={colors.bone} size="small" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>Kalender {MONTH_LABEL[month - 1]} {year}</Text>
      <View style={styles.weekdayRow}>
        {WEEKDAY_SHORT.map((w) => (
          <Text key={w} style={styles.weekdayText}>{w}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: days.offset }, (_, i) => (
          <View key={`pad-${i}`} style={styles.dayCell} />
        ))}
        {Array.from({ length: days.count }, (_, i) => {
          const day = i + 1;
          const key = dateKey(year, month, day);
          const s = scheduleByDate.get(key);
          const isSelected = selectedDate === key;
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.dayCell,
                s && styles.dayCellScheduled,
                isSelected && styles.dayCellSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => openDay(day)}
            >
              <Text style={[styles.dayText, s && styles.dayTextScheduled, isSelected && styles.dayTextSelected]}>{day}</Text>
              {s && <Text style={[styles.dayTime, isSelected && styles.dayTextSelected]}>{s.startTime}</Text>}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>Tap tanggal untuk menambah/mengubah jadwal shift. Tanggal tanpa jadwal memakai jam kerja standar.</Text>

      <CsvImportModal
        visible={importVisible}
        title={`Import Jadwal — ${MONTH_LABEL[month - 1]} ${year}`}
        hint="Kolom: tanggal,jam_mulai,jam_selesai — satu baris per tanggal. Baris bermasalah dilewati dan dilaporkan."
        placeholder={'tanggal,jam_mulai,jam_selesai\n2026-09-01,13:00,21:00\n2026-09-02,13:00,21:00'}
        template={{
          filename: `template-jadwal-${year}-${String(month).padStart(2, '0')}.csv`,
          content: 'tanggal,jam_mulai,jam_selesai\n2026-09-01,13:00,21:00\n2026-09-02,13:00,21:00\n2026-09-03,13:00,21:00',
        }}
        busy={importBusy}
        onSubmit={doImport}
        onClose={() => setImportVisible(false)}
      />
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
  employeeRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  employeeChip: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  employeeChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  employeeChipText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  employeeChipTextActive: {
    color: colors.bone,
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
  ioRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  ioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
  },
  ioBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  editBox: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ink,
    padding: spacing.lg,
    gap: spacing.md,
  },
  editTitle: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.semibold,
    fontSize: font.heading,
    color: colors.ink,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.red,
    paddingVertical: spacing.md,
  },
  removeBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.red,
  },
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingVertical: spacing.md,
  },
  saveBtnText: {
    ...typography.label,
    fontSize: 11,
    color: colors.bone,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayText: {
    flex: 1,
    ...typography.label,
    fontSize: 9,
    color: colors.ink38,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.ink12,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.ink12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dayCellScheduled: {
    backgroundColor: colors.ink12,
  },
  dayCellSelected: {
    backgroundColor: colors.ink,
  },
  dayText: {
    fontFamily: fontFamily.semibold,
    fontSize: font.caption,
    color: colors.ink60,
  },
  dayTextScheduled: {
    color: colors.ink,
  },
  dayTextSelected: {
    color: colors.bone,
  },
  dayTime: {
    fontFamily: fontFamily.semibold,
    fontSize: font.tiny,
    color: colors.ink,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
});