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
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import type { EmployeeRecord } from '@/types/leave';
import {
  formatRupiah,
  type MaritalStatus,
  type SalaryAllowance,
  type SalarySettingRecord,
} from '@/types/payroll';

interface FormState {
  baseSalary: string;
  allowances: SalaryAllowance[];
  npwp: string;
  maritalStatus: MaritalStatus;
  dependents: number;
  bpjsKesehatan: boolean;
  bpjsKetenagakerjaan: boolean;
  bankName: string;
  bankAccount: string;
}

function emptyForm(): FormState {
  return {
    baseSalary: '',
    allowances: [],
    npwp: '',
    maritalStatus: 'single',
    dependents: 0,
    bpjsKesehatan: true,
    bpjsKetenagakerjaan: true,
    bankName: '',
    bankAccount: '',
  };
}

export default function AdminKelolaGajiScreen() {
  const [settings, setSettings] = useState<SalarySettingRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([
        apiFetch<{ settings: SalarySettingRecord[] }>('/api/salary-settings'),
        apiFetch<{ employees: EmployeeRecord[] }>('/api/employees'),
      ]);
      setSettings(s.settings);
      setEmployees(e.employees.filter((emp) => emp.status === 'active'));
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (s: SalarySettingRecord | undefined) => {
    setOpenId(s?.userId ?? null);
    setForm(
      s
        ? {
            baseSalary: String(s.baseSalary),
            allowances: s.allowances.map((a) => ({ ...a })),
            npwp: s.npwp ?? '',
            maritalStatus: s.maritalStatus,
            dependents: s.dependents,
            bpjsKesehatan: s.bpjsKesehatan,
            bpjsKetenagakerjaan: s.bpjsKetenagakerjaan,
            bankName: s.bankName ?? '',
            bankAccount: s.bankAccount ?? '',
          }
        : emptyForm(),
    );
  };

  const setAllowance = (index: number, patch: Partial<SalaryAllowance>) => {
    setForm((f) => ({
      ...f,
      allowances: f.allowances.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }));
  };

  const save = async (userId: string) => {
    const baseSalary = Number(form.baseSalary);
    if (!Number.isInteger(baseSalary) || baseSalary < 0) {
      Alert.alert('Data tidak valid', 'Gaji pokok harus bilangan bulat >= 0.');
      return;
    }
    const allowances = form.allowances.filter((a) => a.name.trim() && a.amount > 0);
    setSaving(true);
    try {
      await apiFetch(`/api/salary-settings/${userId}`, {
        method: 'PUT',
        body: {
          baseSalary,
          allowances,
          npwp: form.npwp.trim() || null,
          maritalStatus: form.maritalStatus,
          dependents: form.dependents,
          bpjsKesehatan: form.bpjsKesehatan,
          bpjsKetenagakerjaan: form.bpjsKetenagakerjaan,
          bankName: form.bankName.trim() || null,
          bankAccount: form.bankAccount.trim() || null,
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

  const settingByUser = new Map(settings.map((s) => [s.userId, s]));
  const rows = employees.map((emp) => ({ emp, setting: settingByUser.get(emp.userId) }));
  const withSalary = rows.filter((r) => r.setting).length;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionLabel}>
        Data Gaji ({withSalary}/{rows.length} karyawan)
      </Text>
      <Text style={styles.hint}>
        Wajib diisi sebelum menjalankan payroll. Karyawan tanpa data gaji dilewati saat perhitungan.
      </Text>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        rows.map(({ emp, setting }) => {
          const isOpen = openId === emp.userId;
          return (
            <View key={emp.userId} style={[styles.card, isOpen && styles.cardOpen]}>
              <Pressable style={styles.cardHead} onPress={() => (isOpen ? setOpenId(null) : open(setting))}>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{emp.name}</Text>
                  <Text style={styles.meta}>
                    {emp.position ?? '-'}
                    {setting ? ` · ${formatRupiah(setting.baseSalary)}` : ' · Belum ada data gaji'}
                  </Text>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ink38} />
              </Pressable>

              {isOpen && (
                <View style={styles.editArea}>
                  <Text style={styles.fieldLabel}>Gaji Pokok (Rp)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="mis. 5000000"
                    placeholderTextColor={colors.ink38}
                    keyboardType="number-pad"
                    value={form.baseSalary}
                    onChangeText={(v) => setForm((f) => ({ ...f, baseSalary: v.replace(/[^\d]/g, '') }))}
                  />

                  <Text style={styles.fieldLabel}>Tunjangan Tetap</Text>
                  {form.allowances.map((a, i) => (
                    <View key={i} style={styles.allowanceRow}>
                      <TextInput
                        style={[styles.input, styles.allowanceName]}
                        placeholder="Nama (mis. Transport)"
                        placeholderTextColor={colors.ink38}
                        value={a.name}
                        onChangeText={(name) => setAllowance(i, { name })}
                      />
                      <TextInput
                        style={[styles.input, styles.allowanceAmount]}
                        placeholder="Rp"
                        placeholderTextColor={colors.ink38}
                        keyboardType="number-pad"
                        value={a.amount ? String(a.amount) : ''}
                        onChangeText={(amount) => setAllowance(i, { amount: Number(amount.replace(/[^\d]/g, '')) || 0 })}
                      />
                      <Pressable style={styles.removeBtn} onPress={() => setForm((f) => ({ ...f, allowances: f.allowances.filter((_, j) => j !== i) }))}>
                        <Ionicons name="close" size={16} color={colors.red} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                    onPress={() => setForm((f) => ({ ...f, allowances: [...f.allowances, { name: '', amount: 0 }] }))}
                  >
                    <Text style={styles.addBtnText}>+ Tambah Tunjangan</Text>
                  </Pressable>

                  <Text style={styles.fieldLabel}>NPWP</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Kosongkan bila tidak punya NPWP (tarif +20%)"
                    placeholderTextColor={colors.ink38}
                    value={form.npwp}
                    onChangeText={(npwp) => setForm((f) => ({ ...f, npwp }))}
                  />

                  <Text style={styles.fieldLabel}>Status Pajak</Text>
                  <View style={styles.toggleRow}>
                    {(['single', 'married'] as const).map((m) => (
                      <Pressable
                        key={m}
                        style={({ pressed }) => [styles.toggle, form.maritalStatus === m && styles.toggleActive, pressed && styles.pressed]}
                        onPress={() => setForm((f) => ({ ...f, maritalStatus: m }))}
                      >
                        <Text style={[styles.toggleText, form.maritalStatus === m && styles.toggleTextActive]}>
                          {m === 'single' ? 'Lajang' : 'Menikah'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Tanggungan ({form.dependents})</Text>
                  <View style={styles.chipRow}>
                    {[0, 1, 2, 3].map((d) => (
                      <Pressable
                        key={d}
                        style={({ pressed }) => [styles.chip, form.dependents === d && styles.chipActive, pressed && styles.pressed]}
                        onPress={() => setForm((f) => ({ ...f, dependents: d }))}
                      >
                        <Text style={[styles.chipText, form.dependents === d && styles.chipTextActive]}>{d}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Potongan BPJS</Text>
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={({ pressed }) => [styles.toggle, form.bpjsKesehatan && styles.toggleActive, pressed && styles.pressed]}
                      onPress={() => setForm((f) => ({ ...f, bpjsKesehatan: !f.bpjsKesehatan }))}
                    >
                      <Text style={[styles.toggleText, form.bpjsKesehatan && styles.toggleTextActive]}>Kesehatan</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.toggle, form.bpjsKetenagakerjaan && styles.toggleActive, pressed && styles.pressed]}
                      onPress={() => setForm((f) => ({ ...f, bpjsKetenagakerjaan: !f.bpjsKetenagakerjaan }))}
                    >
                      <Text style={[styles.toggleText, form.bpjsKetenagakerjaan && styles.toggleTextActive]}>Ketenagakerjaan</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.fieldLabel}>Bank (untuk slip)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="mis. BCA"
                    placeholderTextColor={colors.ink38}
                    value={form.bankName}
                    onChangeText={(bankName) => setForm((f) => ({ ...f, bankName }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nomor rekening"
                    placeholderTextColor={colors.ink38}
                    value={form.bankAccount}
                    onChangeText={(bankAccount) => setForm((f) => ({ ...f, bankAccount }))}
                  />

                  <Pressable
                    style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                    onPress={() => save(emp.userId)}
                    disabled={saving}
                  >
                    {saving ? <ActivityIndicator color={colors.bone} size="small" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
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
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
  allowanceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  allowanceName: {
    flex: 1,
  },
  allowanceAmount: {
    width: 110,
  },
  removeBtn: {
    padding: spacing.sm,
  },
  addBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.ink38,
  },
  addBtnText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  toggleText: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  toggleTextActive: {
    color: colors.bone,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minWidth: 44,
    alignItems: 'center',
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