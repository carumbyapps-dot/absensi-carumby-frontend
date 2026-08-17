import { Platform } from 'react-native';
import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL = 'shift-reminders';

let mod: NotificationsModule | null = null;
let loadTried = false;

/** Di Expo Go (SDK 53+) modul notifikasi terbatas & memicu error — nonaktifkan total. */
function isExpoGo(): boolean {
  try {
    return Constants.appOwnership === 'expo';
  } catch {
    return false;
  }
}

/**
 * Muat expo-notifications secara dinamis. Di Expo Go SDK 53+ modul ini
 * melempar error saat di-import — jadi dibungkus try/catch agar aplikasi
 * tetap berjalan (fitur pengingat otomatis nonaktif sampai pakai
 * development build).
 */
async function getNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web' || isExpoGo()) return null;
  if (mod) return mod;
  if (loadTried) return null;
  loadTried = true;
  try {
    mod = await import('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return mod;
  } catch (err) {
    console.warn(
      '[notifikasi] expo-notifications gagal dimuat — pengingat shift & notifikasi pengumuman nonaktif',
      err instanceof Error ? err.message : '',
    );
    return null;
  }
}

/** Notifikasi lokal tidak didukung di web (guard untuk semua pemanggil). */
export function notificationsSupported(): boolean {
  return Platform.OS !== 'web' && !isExpoGo();
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const N = await getNotifications();
  if (!N) return false;
  try {
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    const req = await N.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

async function ensureChannel(N: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await N.setNotificationChannelAsync(CHANNEL, {
      name: 'Pengingat Shift',
      importance: N.AndroidImportance.DEFAULT,
    });
  } catch {
    // abaikan — kanal default tetap dipakai
  }
}

export interface ShiftReminderInput {
  startTime: string;
  endTime: string;
  date: Date;
}

/**
 * Jadwalkan pengingat lokal: 10 menit sebelum jam masuk dan 10 menit
 * sebelum jam pulang (mengikuti jadwal shift hari ini; fallback 08:00–17:00).
 * Pengingat lama dibatalkan dulu agar tidak menumpuk.
 */
export async function scheduleShiftReminders(shift: ShiftReminderInput): Promise<void> {
  if (!notificationsSupported()) return;
  const N = await getNotifications();
  if (!N) return;
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  await ensureChannel(N);

  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    // lanjut walau pembatalan gagal
  }

  const start = shift.startTime ?? '08:00';
  const end = shift.endTime ?? '17:00';

  const at = (hhmm: string, offsetMinutes: number): Date => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date(shift.date.getFullYear(), shift.date.getMonth(), shift.date.getDate(), h, m, 0, 0);
    d.setMinutes(d.getMinutes() - offsetMinutes);
    return d;
  };

  const items = [
    {
      date: at(start, 10),
      title: 'Jam masuk 10 menit lagi',
      body: `Shift kamu mulai pukul ${start}. Siapkan absen masuk.`,
    },
    {
      date: at(end, 10),
      title: 'Jam pulang 10 menit lagi',
      body: `Shift selesai pukul ${end}. Jangan lupa absen keluar.`,
    },
  ];

  for (const item of items) {
    if (item.date.getTime() <= Date.now()) continue;
    try {
      await N.scheduleNotificationAsync({
        content: { title: item.title, body: item.body, sound: true },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: item.date,
          channelId: CHANNEL,
        },
      });
    } catch {
      // abaikan satu pengingat gagal
    }
  }
}

/** Notifikasi langsung saat ada pengumuman baru dari admin. */
export async function notifyAnnouncement(title: string, body: string): Promise<void> {
  if (!notificationsSupported()) return;
  const N = await getNotifications();
  if (!N) return;
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  try {
    await N.scheduleNotificationAsync({
      content: { title: `Pengumuman: ${title}`, body, sound: true },
      trigger: null,
    });
  } catch {
    // abaikan
  }
}