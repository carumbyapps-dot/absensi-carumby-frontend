import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { colors, font, fontFamily, numerals, spacing, typography } from '@/theme';
import { useRecordById } from '@/store/attendance';
import { TYPE_LABEL } from '@/types/attendance';
import StatusBadge from '@/components/StatusBadge';
import PhotoPlaceholder from '@/components/PhotoPlaceholder';
import MapPreview from '@/components/MapPreview';

function formatFullTime(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${time} - ${date}`;
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { record, loading, error } = useRecordById(id);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.notFoundText}>Memuat detail absen…</Text>
      </View>
    );
  }

  if (!record || error) {
    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={40} color={colors.ink38} />
        <Text style={styles.notFoundTitle}>Catatan tidak ditemukan</Text>
        <Text style={styles.notFoundText}>{error ?? 'Data absen ini tidak tersedia.'}</Text>
      </View>
    );
  }

  const isIn = record.type === 'in';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: isIn ? colors.lumut : colors.ink }]}>
          <Ionicons
            name={isIn ? 'arrow-up' : 'arrow-down'}
            size={22}
            color={colors.bone}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{TYPE_LABEL[record.type]}</Text>
          <Text style={styles.subtitle}>{formatFullTime(record.timestamp)}</Text>
        </View>
        <StatusBadge status={record.status} />
      </View>

      <PhotoPlaceholder uri={record.photoUrl ?? record.photoPath} height={260} />

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Lokasi Absen</Text>
        {record.latitude !== null && record.longitude !== null ? (
          <>
            <MapPreview latitude={record.latitude} longitude={record.longitude} height={160} />
            <Text style={styles.coords}>
              {record.latitude.toFixed(5)}, {record.longitude.toFixed(5)}
            </Text>
          </>
        ) : (
          <Text style={styles.coords}>Lokasi tidak tersedia.</Text>
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Informasi Lengkap</Text>
        <InfoRow label="Jenis" value={TYPE_LABEL[record.type]} />
        <InfoRow label="Waktu" value={formatFullTime(record.timestamp)} />
        <InfoRow
          label="Status"
          value={record.status === 'on_time' ? 'Tepat Waktu' : record.status === 'late' ? 'Terlambat' : record.status === 'early_out' ? 'Pulang Awal' : 'Belum ada status'}
        />
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  notFoundTitle: {
    ...typography.d3,
    fontSize: 16,
    color: colors.ink,
  },
  notFoundText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.d3,
    fontSize: 16,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  block: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
    gap: spacing.md,
  },
  blockTitle: {
    ...typography.label,
    color: colors.ink,
  },
  coords: {
    ...numerals,
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  infoLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.ink38,
  },
  infoValue: {
    fontFamily: fontFamily.semibold,
    fontSize: font.body,
    color: colors.ink,
  },
});