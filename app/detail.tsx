import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { colors, font, radius, spacing } from '@/theme';
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
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.notFoundText}>Memuat detail absen…</Text>
      </View>
    );
  }

  if (!record || error) {
    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={40} color={colors.textMuted} />
        <Text style={styles.notFoundTitle}>Catatan tidak ditemukan</Text>
        <Text style={styles.notFoundText}>{error ?? 'Data absen ini tidak tersedia.'}</Text>
      </View>
    );
  }

  const isIn = record.type === 'in';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: isIn ? colors.successLight : colors.primaryLight }]}>
          <Ionicons
            name={isIn ? 'arrow-up-circle' : 'arrow-down-circle'}
            size={28}
            color={isIn ? colors.success : colors.primary}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{TYPE_LABEL[record.type]}</Text>
          <Text style={styles.subtitle}>{formatFullTime(record.timestamp)}</Text>
        </View>
        <StatusBadge status={record.status} />
      </View>

      <PhotoPlaceholder uri={record.photoUrl ?? record.photoPath} height={260} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lokasi Absen</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informasi Lengkap</Text>
        <InfoRow label="Jenis" value={TYPE_LABEL[record.type]} />
        <InfoRow label="Waktu" value={formatFullTime(record.timestamp)} />
        <InfoRow
          label="Status"
          value={record.status === 'on_time' ? 'Tepat Waktu' : record.status === 'late' ? 'Terlambat' : 'Belum ada status'}
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
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  notFoundTitle: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  notFoundText: {
    fontSize: font.label,
    color: colors.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: font.label,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.text,
  },
  coords: {
    fontSize: font.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: font.label,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.text,
  },
});