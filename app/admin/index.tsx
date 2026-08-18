import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import MenuCard from '@/components/MenuCard';

export default function AdminScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Operasional</Text>
        <MenuCard
          icon="stats-chart-outline"
          title="Statistik"
          subtitle="Ringkasan kehadiran hari ini & 7 hari terakhir"
          onPress={() => router.push('/admin/statistik')}
        />
        <MenuCard
          icon="checkmark-done-outline"
          title="Persetujuan Cuti"
          subtitle="Tinjau & putuskan pengajuan karyawan"
          onPress={() => router.push('/admin/approve')}
        />
        <MenuCard
          icon="megaphone-outline"
          title="Pengumuman"
          subtitle="Kirim himbauan ke semua karyawan"
          onPress={() => router.push('/admin/pengumuman')}
        />
        <MenuCard
          icon="create-outline"
          title="Absen Manual"
          subtitle="Input absen karyawan yang terkendala perangkat/jaringan"
          onPress={() => router.push('/admin/absen-manual')}
        />
        <MenuCard
          icon="people-outline"
          title="Data Karyawan"
          subtitle="Divisi, jabatan, tanggal masuk, peran"
          onPress={() => router.push('/admin/karyawan')}
        />
        <MenuCard
          icon="time-outline"
          title="Jadwal Kerja"
          subtitle="Shift per karyawan per tanggal (host live, packer)"
          onPress={() => router.push('/admin/jadwal')}
        />
        <MenuCard
          icon="document-text-outline"
          title="Rekap Absensi"
          subtitle="Export rekap absensi bulanan (CSV)"
          onPress={() => router.push('/admin/rekap')}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Referensi</Text>
        <MenuCard
          icon="business-outline"
          title="Divisi"
          subtitle="Kelola struktur divisi organisasi"
          onPress={() => router.push('/admin/divisi')}
        />
        <MenuCard
          icon="calendar-outline"
          title="Hari Libur"
          subtitle="Kelola libur nasional & libur bersama"
          onPress={() => router.push('/admin/libur')}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Keuangan</Text>
        <MenuCard
          icon="cash-outline"
          title="Payroll"
          subtitle="Hitung, simpan & rekap gaji bulanan"
          onPress={() => router.push('/admin/payroll')}
        />
        <MenuCard
          icon="card-outline"
          title="Kelola Gaji"
          subtitle="Gaji pokok, tunjangan, NPWP & BPJS karyawan"
          onPress={() => router.push('/admin/gaji')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});