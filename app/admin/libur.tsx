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
import { downloadCsv, downloadCsvContent } from '@/lib/export';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { formatDateLong, Holiday, HOLIDAY_TYPE_LABEL } from '@/types/leave';
import DateField from '@/components/DateField';

const IMPORT_PLACEHOLDER = `Tahun Baru 2026 = 2026-01-01
2026-01-01 = Tahun Baru 2026
2026-03-29 = Wafat Isa Almasih`;

export default function AdminLiburScreen() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [formDate, setFormDate] = useState('');
  const [formName, setFormName] = useState('');
  const [importText, setImportText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ holidays: Holiday[] }>(`/api/holidays?year=${year}`);
      setHolidays(res.holidays);
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!formDate || !formName.trim()) {
      Alert.alert('Lengkapi dulu', 'Tanggal dan nama hari libur wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/holidays', {
        method: 'POST',
        body: { date: formDate, name: formName.trim(), type: 'national' },
      });
      setFormDate('');
      setFormName('');
      await load();
    } catch (err) {
      Alert.alert('Gagal menambah', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doImport = async () => {
    const lines = importText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const items: { date: string; name: string }[] = [];
    for (const line of lines) {
      const match = line.match(/^(\d{4}-\d{2}-\d{2})\s*[=:]\s*(.+)$/) ?? line.match(/^(.+?)\s*[=:]\s*(\d{4}-\d{2}-\d{2})$/);
      if (!match) continue;
      items.push({ date: match[1], name: match[2].trim() });
    }
    if (items.length === 0) {
      Alert.alert('Format tidak dikenali', 'Contoh: 2026-01-01 = Tahun Baru 2026 (satu baris per tanggal)');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/holidays/import', {
        method: 'POST',
        body: items,
      });
      Alert.alert('Impor selesai', res.message);
      setImportText('');
      await load();
    } catch (err) {
      Alert.alert('Impor gagal', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (h: Holiday) => {
    Alert.alert('Hapus hari libur?', `${h.name} (${formatDateLong(h.date)})`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/holidays/${h.id}`, { method: 'DELETE' });
            await load();
          } catch (err) {
            Alert.alert('Gagal menghapus', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const doExport = async () => {
    const ok = await downloadCsv(`/api/holidays/export?year=${year}`);
    if (ok === null) {
      Alert.alert('Gagal mengekspor', 'Tidak dapat mengambil data.');
    } else if (!ok) {
      Alert.alert('CSV disalin', 'CSV disalin ke clipboard — tempel di Excel/Sheets.');
    }
  };

  const doTemplate = async () => {
    const ok = await downloadCsvContent(
      'template-hari-libur.txt',
      '2027-01-01 = Tahun Baru 2027\n2027-02-09 = Tahun Baru Imlek 2578 Kongzili\n2027-04-13 = Hari Raya Idul Fitri 1448 Hijriah',
    );
    if (!ok) {
      Alert.alert('Template disalin', 'Template disalin ke clipboard — tempel lalu ubah sesuai daftar hari libur.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.yearRow}>
        <Pressable style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]} onPress={() => setYear(year - 1)}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.yearLabel}>{year}</Text>
        <Pressable style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]} onPress={() => setYear(year + 1)}>
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]} onPress={doExport}>
        <Ionicons name="share-outline" size={14} color={colors.ink} />
        <Text style={styles.exportBtnText}>Export CSV ({year})</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Tambah Hari Libur</Text>
      <DateField label="Tanggal" value={formDate} onChange={setFormDate} />
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Nama hari libur (mis. Tahun Baru 2027)"
          placeholderTextColor={colors.ink38}
          value={formName}
          onChangeText={setFormName}
        />
        <Pressable style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]} onPress={add} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bone} size="small" /> : <Ionicons name="add" size={20} color={colors.bone} />}
        </Pressable>
      </View>

      <View style={styles.ioRow}>
        <Text style={styles.sectionLabel}>Impor Massal</Text>
        <Pressable style={({ pressed }) => [styles.templateBtn, pressed && styles.pressed]} onPress={doTemplate}>
          <Ionicons name="download-outline" size={13} color={colors.red} />
          <Text style={styles.templateBtnText}>Unduh Template</Text>
        </Pressable>
      </View>
      <TextInput
        style={[styles.input, styles.importArea]}
        placeholder={IMPORT_PLACEHOLDER}
        placeholderTextColor={colors.ink38}
        multiline
        numberOfLines={4}
        value={importText}
        onChangeText={setImportText}
      />
      <Pressable style={({ pressed }) => [styles.importBtn, pressed && styles.pressed]} onPress={doImport} disabled={saving}>
        <Text style={styles.importBtnText}>Impor</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Daftar Libur {year} ({holidays.length})</Text>
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : holidays.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Belum ada hari libur tercatat</Text>
        </View>
      ) : (
        holidays.map((h) => (
          <View key={h.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{h.name}</Text>
              <Text style={styles.rowMeta}>
                {formatDateLong(h.date)} · {HOLIDAY_TYPE_LABEL[h.type]}
              </Text>
            </View>
            <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} onPress={() => remove(h)}>
              <Ionicons name="trash-outline" size={18} color={colors.red} />
            </Pressable>
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
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.ink12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  yearLabel: {
    ...typography.d3,
    color: colors.ink,
    fontSize: 20,
    minWidth: 80,
    textAlign: 'center',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  exportBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  ioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  templateBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.red,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  addBtn: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
  importArea: {
    textAlignVertical: 'top',
    minHeight: 110,
  },
  importBtn: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  importBtnText: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
    paddingVertical: spacing.md,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});