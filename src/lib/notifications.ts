import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL = 'shift-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Notifikasi lokal tidak didukung di web (guard untuk semua pemanggil). */
export function notificationsSupported(): boolean {
  return Platform.OS !== 'web';
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Pengingat Shift',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
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
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

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
    await Notifications.scheduleNotificationAsync({
      content: { title: item.title, body: item.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.date,
        channelId: CHANNEL,
      },
    });
  }
}

/** Notifikasi langsung saat ada pengumuman baru dari admin. */
export async function notifyAnnouncement(title: string, body: string): Promise<void> {
  if (!notificationsSupported()) return;
  const granted = await ensureNotificationPermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: `Pengumuman: ${title}`, body, sound: true },
    trigger: null,
  });
}
