import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, fontFamily, numerals, radius, spacing, typography } from '@/theme';
import { useNow, formatClock, formatDateLong, greeting } from '@/hooks/useNow';
import { useRecordsForDate } from '@/store/attendance';
import { useAuth } from '@/store/auth';
import { apiFetch, toDateKey } from '@/lib/api';
import { scheduleShiftReminders, notifyAnnouncement } from '@/lib/notifications';
import { ANNOUNCEMENT_LAST_SEEN_KEY, AnnouncementRecord } from '@/types/announcement';
import { WorkScheduleRecord } from '@/types/schedule';
import AttendanceRow from '@/components/AttendanceRow';
import MenuCard from '@/components/MenuCard';
import BrandMark from '@/components/BrandMark';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const now = useNow();
  const { user, status } = useAuth();
  const { records, loading, error, reload } = useRecordsForDate(new Date());
  const todayRecords = records ?? [];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    (async () => {
      const nowD = new Date();
      // 1. Pengingat shift hari ini (10 menit sebelum masuk & pulang)
      try {
        const s = await apiFetch<{ schedules: WorkScheduleRecord[] }>(
          `/api/schedules/mine?year=${nowD.getFullYear()}&month=${nowD.getMonth() + 1}`,
        );
        const todayShift = s.schedules.find((x) => x.date === toDateKey(nowD));
        await scheduleShiftReminders({
          startTime: todayShift?.startTime ?? '08:00',
          endTime: todayShift?.endTime ?? '17:00',
          date: nowD,
        });
      } catch {
        // pengingat opsional — jangan ganggu layar utama
      }
      // 2. Deteksi pengumuman baru
      try {
        const a = await apiFetch<{ announcements: AnnouncementRecord[] }>('/api/announcements');
        const lastRaw = await AsyncStorage.getItem(ANNOUNCEMENT_LAST_SEEN_KEY);
        const lastId = lastRaw ? Number(lastRaw) : 0;
        const newest = a.announcements[0];
        if (newest && newest.id > lastId) {
          if (!active) return;
          setUnreadCount(a.announcements.filter((x) => x.id > lastId).length);
          if (lastId > 0) {
            await notifyAnnouncement(newest.title, newest.body);
          }
        }
      } catch {
        // opsional
      }
    })();
    return () => {
      active = false;
    };
  }, [status]);

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
            tintColor={colors.ink}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BrandMark size={34} />
            <View>
              <Text style={styles.greeting}>{greeting(now)}</Text>
              <Text style={styles.headerName}>{displayName}</Text>
              <Text style={styles.headerDate}>{formatDateLong(now)}</Text>
            </View>
          </View>
          <Link href="/profil" asChild>
            <Pressable style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              {/* Foto avatar jarak jauh sengaja tidak dirender di header beranda —
                  memicu layar kosong pada sebagian perangkat Android (Expo Go).
                  Foto profil tetap tampil di layar Profil. */}
              <Ionicons name="person" size={20} color={colors.bone} />
            </Pressable>
          </Link>
        </View>

        <View style={styles.hero}>
          <ErrorBoundary>
            <View style={styles.heroTop}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>Waktu sekarang</Text>
            </View>
            <Text style={styles.clock}>{formatClock(now)}</Text>
          </View>

          <Text style={styles.heroTitle}>Absen Sekarang</Text>
          <Text style={styles.heroSubtitle}>{absenStateLabel}</Text>

          <Pressable
            style={({ pressed }) => [styles.heroButton, pressed && styles.buttonPressed]}
            onPress={() => router.push({ pathname: '/absen', params: { mode: nextMode } })}
          >
            <Ionicons
              name={nextMode === 'in' ? 'log-in-outline' : 'log-out-outline'}
              size={18}
              color={colors.bone}
            />
            <Text style={styles.heroButtonText}>{nextModeLabel}</Text>
          </Pressable>
          </ErrorBoundary>
        </View>

        <View style={styles.section}>
          <ErrorBoundary>
          <Text style={styles.sectionLabel}>Menu</Text>
          <MenuCard
            icon="person-outline"
            iconColor={colors.ink}
            title="Profil Saya"
            subtitle="Foto profil, pengaturan & logout"
            onPress={() => router.push('/profil')}
          />
          <MenuCard
            icon="calendar-outline"
            iconColor={colors.ink}
            title="Riwayat Absen"
            subtitle="Lihat riwayat dan filter per tanggal"
            onPress={() => router.push('/riwayat')}
          />
          <MenuCard
            icon="bed-outline"
            iconColor={colors.ink}
            title="Cuti & Izin"
            subtitle="Ajukan cuti, lihat saldo dan riwayat pengajuan"
            onPress={() => router.push('/cuti')}
          />
          <MenuCard
            icon="calendar-clear-outline"
            iconColor={colors.ink}
            title="Kalender Libur"
            subtitle="Hari libur nasional, libur bersama & perusahaan"
            onPress={() => router.push('/kalender')}
          />
          <MenuCard
            icon="wallet-outline"
            iconColor={colors.ink}
            title="Gaji & Slip"
            subtitle="Slip gaji bulanan dan unduh PDF"
            onPress={() => router.push('/gaji')}
          />
          <MenuCard
            icon="megaphone-outline"
            iconColor={unreadCount > 0 ? colors.red : colors.ink}
            title="Pengumuman"
            subtitle={unreadCount > 0 ? `${unreadCount} pengumuman baru` : 'Himbauan & info dari HRD'}
            onPress={() => {
              setUnreadCount(0);
              router.push('/pengumuman');
            }}
          />
          {user?.role === 'admin' && (
            <MenuCard
              icon="shield-checkmark-outline"
              iconColor={colors.red}
              title="Panel Admin"
              subtitle="Persetujuan cuti, data karyawan, divisi & libur"
              onPress={() => router.push('/admin' as Href)}
            />
          )}
          </ErrorBoundary>
        </View>

        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionLabel}>Absen Hari Ini</Text>
            <Pressable onPress={() => router.push('/riwayat')}>
              <Text style={styles.linkText}>Lihat semua</Text>
            </Pressable>
          </View>

          {loading && records === null ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.stateText}>Memuat data absen…</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={22} color={colors.ink38} />
              <Text style={styles.stateText}>{error}</Text>
              <Pressable onPress={() => reload()}>
                <Text style={styles.linkText}>Coba lagi</Text>
              </Pressable>
            </View>
          ) : todayRecords.length === 0 ? (
            <View style={styles.stateBox}>
              <Ionicons name="calendar-clear-outline" size={22} color={colors.ink38} />
              <Text style={styles.stateText}>Belum ada absen hari ini</Text>
            </View>
          ) : (
            <View>
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
    backgroundColor: colors.bone,
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
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  greeting: {
    ...typography.label,
    color: colors.ink60,
    fontSize: 10,
  },
  headerName: {
    ...typography.d2,
    color: colors.ink,
    fontSize: 24,
    marginTop: 4,
  },
  headerDate: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.6,
  },
  hero: {
    backgroundColor: colors.ink,
    padding: spacing.xl,
  },
  heroTop: {
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
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.lumut,
  },
  liveLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.bone55,
  },
  clock: {
    ...numerals,
    fontFamily: fontFamily.black,
    fontSize: font.d3,
    color: colors.bone,
    letterSpacing: 0.6,
  },
  heroTitle: {
    ...typography.d1,
    color: colors.bone,
    fontSize: 28,
    marginTop: spacing.xl,
  },
  heroSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.bone55,
    marginTop: spacing.xs,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  heroButtonText: {
    ...typography.label,
    color: colors.bone,
    fontSize: 12,
  },
  section: {
    marginTop: spacing.xl,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
  },
  linkText: {
    ...typography.label,
    fontSize: 10,
    color: colors.red,
  },
  stateBox: {
    alignItems: 'center',
    gap: spacing.md,
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
});