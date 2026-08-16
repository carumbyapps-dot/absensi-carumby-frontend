// Tipe domain Fase 3 — jadwal kerja (shift) per karyawan per tanggal.

export interface WorkScheduleRecord {
  id: number;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export const WEEKDAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
