// Tipe domain Fase 1 — cuti, hari libur, divisi, data kepegawaian.

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  daysPerYear: number | null;
  paid: boolean;
  maxDaysPerRequest: number | null;
  requiresDocument: boolean;
  active: boolean;
}

export interface LeaveRecord {
  id: number;
  userId: string;
  userName: string;
  typeId: number;
  typeName: string;
  typeCode: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  adminNote: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
  createdAt: Date;
}

export interface LeaveBalance {
  typeId: number;
  typeCode: string;
  typeName: string;
  paid: boolean;
  entitlement: number | null;
  used: number;
  remaining: number | null;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  type: 'national' | 'collective' | 'company';
}

export interface Division {
  id: number;
  name: string;
  createdAt: Date;
}

export interface EmployeeRecord {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  divisionId: number | null;
  divisionName: string | null;
  position: string | null;
  joinDate: string | null;
  status: 'active' | 'inactive';
  nik: string | null;
  phone: string | null;
  address: string | null;
  gender: 'male' | 'female' | null;
  birthDate: string | null;
  createdAt: Date;
}

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

export const HOLIDAY_TYPE_LABEL: Record<Holiday['type'], string> = {
  national: 'Nasional',
  collective: 'Libur Bersama',
  company: 'Perusahaan',
};

export function formatDateLong(id: string): string {
  const [y, m, d] = id.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d} ${months[m - 1]} ${y}`;
}
