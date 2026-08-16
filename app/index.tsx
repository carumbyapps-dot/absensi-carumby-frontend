import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '@/theme';
import { useNow, formatClock, formatDateLong, greeting } from '@/hooks/useNow';
import { useRecordsForDate } from '@/store/attendance';
import { useAuth } from '@/store/auth';
import AttendanceRow from '@/components/AttendanceRow';
import MenuCard from '@/components/MenuCard';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const now = useNow();
  const { user } = useAuth();
  const { records, loading, error, reload } = useRecordsForDate(new Date());
  const todayRecords = records ?? [];

  const hasCheckedIn = todayRecords.some((r) => r.type === 'in');
  const hasCheckedOut = todayRecords.some((r) => r.type === 'out');
  const nextMode = hasCheckedOut ? 'in' : hasCheckedIn ? 'out' : 'in';
  const nextModeLabel = nextMode === 'in' ? 'Absen Masuk' : 'Absen Keluar';
  const absenStateLabel = hasCheckedOut
    ? 'Sudah absen keluar hari ini'
    : hasCheckedIn
      ? 'Sudah absen masuk, jangan lupa absen keluar'
      : 'Belum absen masuk hari ini';
  const displayName = user?.name ?? 'Pengguna';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && records === null}
            onRefresh={() => reload()}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting(now)}</Text>
            <Text style={styles.headerName}>{displayName}</Text>
            <Text style={styles.headerDate}>{formatDateLong(now)}</Text>
          </View>
          <Link href="/profil" asChild>
            <Pressable style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={24} color={colors.white} />
              )}
            </Pressable>
          </Link>
        </View>

        <View style={styles.absenCard}>
          <View style={styles.absenCardHeader}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>Waktu sekarang</Text>
            </View>
            <Text style={styles.clock}>{formatClock(now)}</Text>
          </View>

          <Text style={styles.absenTitle}>Absen Sekarang</Text>
          <Text style={styles.absenSubtitle}>{absenStateLabel}</Text>

          <Pressable
            style={({ pressed }) => [styles.absenButton, pressed && styles.buttonPressed]}
            onPress={() => router.push({ pathname: '/absen', params: { mode: nextMode } })}
          >
            <Ionicons
              name={nextMode === 'in' ? 'log-in-outline' : 'log-out-outline'}
              size={20}
              color={colors.primaryDark}
            />
            <Text style={styles.absenButtonText}>{nextModeLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.menuSection}>
          <MenuCard
            icon="calendar-outline"
            iconColor={colors.primary}
            iconBg={colors.primaryLight}
            title="Riwayat Absen"
            subtitle="Lihat riwayat dan filter per tanggal"
            onPress={() => router.push('/riwayat')}
          />
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Absen Hari Ini</Text>
            <Pressable onPress={() => router.push('/riwayat')}>
              <Text style={styles.linkText}>Lihat semua</Text>
            </Pressable>
          </View>

          {loading && records === null ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>Memuat data absen…</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
              <Text style={styles.stateText}>{error}</Text>
              <Pressable onPress={() => reload()}>
                <Text style={styles.linkText}>Coba lagi</Text>
              </Pressable>
            </View>
          ) : todayRecords.length === 0 ? (
            <View style={styles.stateBox}>
              <Ionicons name="calendar-clear-outline" size={28} color={colors.textMuted} />
              <Text style={styles.stateText}>Belum ada absen hari ini</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {todayRecords.map((record) => (
                <AttendanceRow key={record.id} record={record} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontSize: font.label,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerName: {
    fontSize: font.title,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  headerDate: {
    fontSize: font.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  absenCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  absenCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: '#34D399',
  },
  liveLabel: {
    fontSize: font.caption,
    color: '#C7D2FE',
    fontWeight: '600',
  },
  clock: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  absenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginTop: spacing.xl,
  },
  absenSubtitle: {
    fontSize: font.body,
    color: '#C7D2FE',
    marginTop: spacing.xs,
  },
  absenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  absenButtonText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  menuSection: {
    marginTop: spacing.lg,
  },
  listSection: {
    marginTop: spacing.xl,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  linkText: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.primary,
  },
  list: {
    gap: spacing.md,
  },
  stateBox: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
  },
  stateText: {
    fontSize: font.label,
    color: colors.textSecondary,
  },
});