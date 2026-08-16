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
import { downloadCsv, importCsv } from '@/lib/export';
import CsvImportModal from '@/components/CsvImportModal';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { Division, EmployeeRecord } from '@/types/leave';
import DateField from '@/components/DateField';

export default function AdminKaryawanScreen() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [position, setPosition] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [divisionId, setDivisionId] = useState<number | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [importVisible, setImportVisible] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, d] = await Promise.all([
        apiFetch<{ employees: EmployeeRecord[] }>('/api/employees'),
        apiFetch<{ divisions: Division[] }>('/api/divisions'),
      ]);
      setEmployees(e.employees);
      setDivisions(d.divisions);
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (emp: EmployeeRecord) => {
    setOpenId(emp.userId);
    setPosition(emp.position ?? '');
    setJoinDate(emp.joinDate ?? '');
    setDivisionId(emp.divisionId);
    setStatus(emp.status);
    setRole(emp.role);
  };

  const save = async (userId: string) => {
    setSaving(true);
    try {
      await apiFetch(`/api/employees/${userId}`, {
        method: 'PATCH',
        body: {
          position: position.trim() || null,
          joinDate: joinDate || null,
          divisionId,
          status,
          role,
        },
      });
      setOpenId(null);
      await load();
    } catch (err) {
      Alert.alert('Gagal menyimpan', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doImport = async (csv: string) => {
    setImportBusy(true);
    try {
      const res = await importCsv('/api/employees/import', { csv });
      Alert.alert('Impor selesai', res?.message ?? '');
      setImportVisible(false);
      await load();
    } catch (err) {
      Alert.alert('Impor gagal', getErrorMessage(err));
    } finally {
      setImportBusy(false);
    }
  };

  const doExport = async () => {
    const ok = await downloadCsv('/api/employees/export');
    if (ok === null) {
      Alert.alert('Gagal mengekspor', 'Tidak dapat mengambil data.');
    } else if (!ok) {
      Alert.alert('CSV disalin', 'CSV disalin ke clipboard — tempel di Excel/Sheets.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.ioRow}>
        <Pressable style={({ pressed }) => [styles.ioBtn, pressed && styles.pressed]} onPress={() => setImportVisible(true)}>
          <Ionicons name="download-outline" size={14} color={colors.ink} />
          <Text style={styles.ioBtnText}>Import CSV</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.ioBtn, pressed && styles.pressed]} onPress={doExport}>
          <Ionicons name="share-outline" size={14} color={colors.ink} />
          <Text style={styles.ioBtnText}>Export CSV</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionLabel}>Karyawan ({employees.length})</Text>
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        employees.map((emp) => {
          const isOpen = openId === emp.userId;
          return (
            <View key={emp.userId} style={[styles.card, isOpen && styles.cardOpen]}>
              <Pressable style={styles.cardHead} onPress={() => (isOpen ? setOpenId(null) : open(emp))}>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{emp.name}</Text>
                  <Text style={styles.meta}>
                    {emp.divisionName ?? 'Belum ada divisi'}
                    {emp.position ? ` · ${emp.position}` : ''}
                  </Text>
                  <Text style={styles.meta}>{emp.email} · {emp.role === 'admin' ? 'Admin' : 'Karyawan'}</Text>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ink38} />
              </Pressable>

              {isOpen && (
                <View style={styles.editArea}>
                  <Text style={styles.fieldLabel}>Jabatan</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="mis. Staff Gudang"
                    placeholderTextColor={colors.ink38}
                    value={position}
                    onChangeText={setPosition}
                  />
                  <DateField label="Tanggal Mulai Bekerja" value={joinDate} onChange={setJoinDate} maximumDate={new Date()} />

                  <Text style={styles.fieldLabel}>Divisi</Text>
                  <View style={styles.chipRow}>
                    {divisions.map((d) => {
                      const active = divisionId === d.id;
                      return (
                        <Pressable
                          key={d.id}
                          style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
                          onPress={() => setDivisionId(active ? null : d.id)}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.name}</Text>
                        </Pressable>
                      );
                    })}
                    {divisions.length === 0 && <Text style={styles.meta}>Belum ada divisi — buat di menu Divisi</Text>}
                  </View>

                  <View style={styles.toggleRow}>
                    <Pressable
                      style={({ pressed }) => [styles.toggle, status === 'active' && styles.toggleActive, pressed && styles.pressed]}
                      onPress={() => setStatus('active')}
                    >
                      <Text style={[styles.toggleText, status === 'active' && styles.toggleTextActive]}>Aktif</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.toggle, status === 'inactive' && styles.toggleActive, pressed && styles.pressed]}
                      onPress={() => setStatus('inactive')}
                    >
                      <Text style={[styles.toggleText, status === 'inactive' && styles.toggleTextActive]}>Nonaktif</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.toggle, role === 'admin' && styles.toggleAdmin, pressed && styles.pressed]}
                      onPress={() => setRole(role === 'admin' ? 'employee' : 'admin')}
                    >
                      <Text style={[styles.toggleText, role === 'admin' && styles.toggleTextActive]}>
                        {role === 'admin' ? 'Admin' : 'Jadikan Admin'}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                    onPress={() => save(emp.userId)}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.bone} size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>Simpan</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}

      <CsvImportModal
        visible={importVisible}
        title="Import Data Karyawan"
        hint="Kolom: nama,email,peran,divisi,jabatan,tanggal_masuk,status. Dicocokkan dengan EMAIL yang sudah terdaftar — tidak membuat akun baru."
        placeholder={'nama,email,peran,divisi,jabatan,tanggal_masuk,status\nBudi Santoso,budi@carumby.id,employee,Gudang,Staff Gudang,2026-01-05,active'}
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
    marginBottom: spacing.md,
  },
  ioRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
  stateBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xxl,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.ink12,
    marginBottom: spacing.md,
  },
  cardOpen: {
    borderColor: colors.ink,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.label,
    fontSize: 13,
    color: colors.ink,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  editArea: {
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
    padding: spacing.lg,
    gap: spacing.sm,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    borderColor: colors.red,
  },
  chipText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  chipTextActive: {
    color: colors.red,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toggle: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingVertical: spacing.md,
  },
  toggleActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  toggleAdmin: {
    borderColor: colors.red,
    backgroundColor: colors.red,
  },
  toggleText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  toggleTextActive: {
    color: colors.bone,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  saveBtnText: {
    ...typography.label,
    fontSize: 11,
    color: colors.bone,
  },
  pressed: {
    opacity: 0.8,
  },
});