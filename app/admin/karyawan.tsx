import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [importVisible, setImportVisible] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

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
    setNik(emp.nik ?? '');
    setPhone(emp.phone ?? '');
    setAddress(emp.address ?? '');
    setGender(emp.gender ?? null);
    setBirthDate(emp.birthDate ?? '');
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
          nik: nik.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          gender,
          birthDate: birthDate || null,
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

  const doCreate = async () => {
    if (!createName.trim() || !/^\S+@\S+\.\S+$/.test(createEmail.trim()) || createPassword.length < 8) {
      Alert.alert('Data tidak valid', 'Nama, email valid, dan kata sandi (min. 8 karakter) wajib diisi.');
      return;
    }
    setCreateBusy(true);
    try {
      const r = await apiFetch<{ message: string }>('/api/employees/accounts', {
        method: 'POST',
        body: { name: createName.trim(), email: createEmail.trim(), password: createPassword },
      });
      Alert.alert('Akun dibuat', `${r.message}\n\nBagikan email & kata sandi ini ke karyawan (mis. via WhatsApp).`);
      setCreateVisible(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      await load();
    } catch (err) {
      Alert.alert('Gagal membuat akun', getErrorMessage(err));
    } finally {
      setCreateBusy(false);
    }
  };

  const doResetPassword = async () => {
    if (!resetUserId || resetPassword.length < 8) {
      Alert.alert('Kata sandi baru wajib', 'Minimal 8 karakter.');
      return;
    }
    setResetBusy(true);
    try {
      const r = await apiFetch<{ message: string }>(`/api/employees/${resetUserId}/reset-password`, {
        method: 'POST',
        body: { newPassword: resetPassword },
      });
      Alert.alert('Selesai', r.message);
      setResetUserId(null);
      setResetPassword('');
    } catch (err) {
      Alert.alert('Gagal mereset', getErrorMessage(err));
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.ioRow}>
        <Pressable style={({ pressed }) => [styles.createBtn, pressed && styles.pressed]} onPress={() => setCreateVisible(true)}>
          <Ionicons name="person-add-outline" size={14} color={colors.bone} />
          <Text style={styles.createBtnText}>Tambah Karyawan</Text>
        </Pressable>
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

                  <Text style={styles.fieldLabel}>Biodata</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="NIK (16 digit)"
                    placeholderTextColor={colors.ink38}
                    keyboardType="number-pad"
                    maxLength={16}
                    value={nik}
                    onChangeText={(v) => setNik(v.replace(/[^\d]/g, ''))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nomor HP / WhatsApp"
                    placeholderTextColor={colors.ink38}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                  <TextInput
                    style={[styles.input, styles.addressInput]}
                    placeholder="Alamat tempat tinggal"
                    placeholderTextColor={colors.ink38}
                    multiline
                    value={address}
                    onChangeText={setAddress}
                  />
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={({ pressed }) => [styles.toggle, gender === 'male' && styles.toggleActive, pressed && styles.pressed]}
                      onPress={() => setGender(gender === 'male' ? null : 'male')}
                    >
                      <Text style={[styles.toggleText, gender === 'male' && styles.toggleTextActive]}>Laki-laki</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.toggle, gender === 'female' && styles.toggleActive, pressed && styles.pressed]}
                      onPress={() => setGender(gender === 'female' ? null : 'female')}
                    >
                      <Text style={[styles.toggleText, gender === 'female' && styles.toggleTextActive]}>Perempuan</Text>
                    </Pressable>
                  </View>
                  <DateField label="Tanggal Lahir" value={birthDate} onChange={setBirthDate} maximumDate={new Date()} />

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
                  <Pressable
                    style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
                    onPress={() => {
                      setResetUserId(emp.userId);
                      setResetPassword('');
                    }}
                  >
                    <Text style={styles.resetBtnText}>Reset Kata Sandi</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}

      <Modal visible={createVisible} transparent animationType="fade" onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Tambah Karyawan</Text>
            <Text style={styles.modalHint}>
              Akun dibuat oleh admin — kata sandi diserahkan langsung ke karyawan (mis. via WhatsApp).
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nama lengkap"
              placeholderTextColor={colors.ink38}
              value={createName}
              onChangeText={setCreateName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.ink38}
              keyboardType="email-address"
              autoCapitalize="none"
              value={createEmail}
              onChangeText={setCreateEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Kata sandi (min. 8 karakter)"
              placeholderTextColor={colors.ink38}
              secureTextEntry
              value={createPassword}
              onChangeText={setCreatePassword}
            />
            <View style={styles.modalActions}>
              <Pressable style={({ pressed }) => [styles.modalCancel, pressed && styles.pressed]} onPress={() => setCreateVisible(false)} disabled={createBusy}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.modalSubmit, pressed && styles.pressed]} onPress={doCreate} disabled={createBusy}>
                {createBusy ? <ActivityIndicator color={colors.bone} size="small" /> : <Text style={styles.modalSubmitText}>Buat Akun</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!resetUserId} transparent animationType="fade" onRequestClose={() => setResetUserId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Reset Kata Sandi</Text>
            <Text style={styles.modalHint}>Semua sesi login karyawan akan dicabut. Berikan kata sandi baru ke karyawan.</Text>
            <TextInput
              style={styles.input}
              placeholder="Kata sandi baru (min. 8 karakter)"
              placeholderTextColor={colors.ink38}
              secureTextEntry
              value={resetPassword}
              onChangeText={setResetPassword}
            />
            <View style={styles.modalActions}>
              <Pressable style={({ pressed }) => [styles.modalCancel, pressed && styles.pressed]} onPress={() => setResetUserId(null)} disabled={resetBusy}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.modalSubmit, pressed && styles.pressed]} onPress={doResetPassword} disabled={resetBusy}>
                {resetBusy ? <ActivityIndicator color={colors.bone} size="small" /> : <Text style={styles.modalSubmitText}>Atur Ulang</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <CsvImportModal
        visible={importVisible}
        title="Import Data Karyawan"        hint="Kolom: nama,email,peran,divisi,jabatan,tanggal_masuk,status,nik,telepon,alamat,jenis_kelamin,tanggal_lahir. Dicocokkan dengan EMAIL yang sudah terdaftar — tidak membuat akun baru."
        placeholder={'nama,email,peran,divisi,jabatan,tanggal_masuk,status,nik,telepon,alamat,jenis_kelamin,tanggal_lahir\nBudi Santoso,budi@carumby.id,employee,Gudang,Staff Gudang,2026-01-05,active,3210987654321098,08123456789,"Jl. Raya Sumedang No. 1",Laki-laki,1998-04-12'}
        template={{
          filename: 'template-data-karyawan.csv',
          content: 'nama,email,peran,divisi,jabatan,tanggal_masuk,status,nik,telepon,alamat,jenis_kelamin,tanggal_lahir\nBudi Santoso,budi@carumby.id,employee,Gudang,Staff Gudang,2026-01-05,active,3210987654321098,08123456789,"Jl. Raya Sumedang No. 1",Laki-laki,1998-04-12',
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
  createBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.red,
    paddingVertical: spacing.sm,
  },
  createBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.bone,
  },
  resetBtn: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  resetBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.ink90,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.ink,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    ...typography.label,
    fontSize: 13,
    color: colors.ink,
  },
  modalHint: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: spacing.md,
  },
  modalCancelText: {
    ...typography.label,
    fontSize: 11,
    color: colors.ink,
  },
  modalSubmit: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingVertical: spacing.md,
  },
  modalSubmitText: {
    ...typography.label,
    fontSize: 11,
    color: colors.bone,
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
  addressInput: {
    minHeight: 64,
    textAlignVertical: 'top',
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