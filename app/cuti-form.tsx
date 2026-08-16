import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { LeaveBalance, LeaveType } from '@/types/leave';
import FormField from '@/components/FormField';
import DateField from '@/components/DateField';

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CutiFormScreen() {
  const router = useRouter();
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balance, setBalance] = useState<LeaveBalance[]>([]);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ types: LeaveType[] }>('/api/leaves/types'),
      apiFetch<{ balance: LeaveBalance[] }>('/api/leaves/balance'),
    ])
      .then(([t, b]) => {
        setTypes(t.types);
        setBalance(b.balance);
        if (t.types.length > 0) setTypeId(t.types[0].id);
      })
      .catch((err) => Alert.alert('Gagal memuat data', getErrorMessage(err)));
  }, []);

  const today = new Date();
  const selectedType = types.find((t) => t.id === typeId) ?? null;
  const selectedBalance = balance.find((b) => b.typeId === typeId) ?? null;

  const submit = async () => {
    if (!typeId || !startDate || !endDate) {
      Alert.alert('Form belum lengkap', 'Pilih jenis cuti dan rentang tanggal');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      Alert.alert('Form belum lengkap', 'Alasan minimal 5 karakter');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/leaves', {
        method: 'POST',
        body: { typeId, startDate, endDate, reason: reason.trim() },
      });
      Alert.alert('Berhasil', 'Pengajuan cuti terkirim, menunggu persetujuan admin');
      router.back();
    } catch (err) {
      Alert.alert('Pengajuan gagal', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionLabel}>Jenis Cuti</Text>
      <View style={styles.typeList}>
        {types.map((t) => {
          const bal = balance.find((b) => b.typeId === t.id);
          const active = typeId === t.id;
          return (
            <Pressable
              key={t.id}
              style={({ pressed }) => [styles.typeItem, active && styles.typeItemActive, pressed && styles.pressed]}
              onPress={() => setTypeId(t.id)}
            >
              <View style={styles.typeInfo}>
                <Text style={[styles.typeName, active && styles.typeNameActive]}>{t.name}</Text>
                <Text style={styles.typeMeta}>
                  {bal?.entitlement !== null && bal
                    ? `Sisa ${bal.remaining} dari ${bal.entitlement} hari`
                    : t.paid
                      ? 'Dibayar'
                      : 'Tanpa bayaran'}
                  {t.requiresDocument ? ' · butuh dokumen' : ''}
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fieldGroup}>
        <DateField
          label="Tanggal Mulai"
          value={startDate}
          onChange={setStartDate}
          minimumDate={today}
        />
        <DateField
          label="Tanggal Selesai"
          value={endDate}
          onChange={setEndDate}
          minimumDate={startDate ? new Date(startDate + 'T00:00:00') : today}
        />
      </View>

      <View style={styles.fieldGroup}>
        <FormField
          label="Alasan"
          placeholder="Tuliskan alasan cuti/izin"
          multiline
          numberOfLines={3}
          value={reason}
          onChangeText={setReason}
          maxLength={300}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.submit, pressed && styles.pressed, submitting && styles.submitDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        {submitting ? (
          <Text style={styles.submitText}>Mengirim…</Text>
        ) : (
          <>
            <Ionicons name="paper-plane-outline" size={18} color={colors.bone} />
            <Text style={styles.submitText}>Kirim Pengajuan</Text>
          </>
        )}
      </Pressable>

      {selectedType && selectedBalance && (
        <Text style={styles.hint}>
          Cuti {selectedType.name}: kuota {selectedBalance.entitlement ?? 'tanpa kuota'} hari, terpakai{' '}
          {selectedBalance.used}, sisa {selectedBalance.remaining ?? '—'}
        </Text>
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
    marginBottom: spacing.md,
  },
  typeList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
  },
  typeItemActive: {
    borderColor: colors.ink,
  },
  pressed: {
    opacity: 0.75,
  },
  typeInfo: {
    flex: 1,
    gap: 2,
  },
  typeName: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  typeNameActive: {
    color: colors.red,
  },
  typeMeta: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  radio: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.ink38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.red,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.red,
  },
  fieldGroup: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...typography.label,
    color: colors.bone,
    fontSize: 12,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.batu,
    marginTop: spacing.lg,
  },
});