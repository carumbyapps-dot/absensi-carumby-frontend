export type AttendanceType = 'in' | 'out';

export type AttendanceStatus = 'on_time' | 'late';

export interface AttendanceRecord {
  id: string;
  type: AttendanceType;
  photoPath: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  status: AttendanceStatus | null;
}

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  on_time: 'Tepat Waktu',
  late: 'Terlambat',
};

export const TYPE_LABEL: Record<AttendanceType, string> = {
  in: 'Absen Masuk',
  out: 'Absen Keluar',
};
