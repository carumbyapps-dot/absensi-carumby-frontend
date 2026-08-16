// Tipe domain Fase 2 — payroll, slip gaji, pengaturan gaji.

export type MaritalStatus = 'single' | 'married';

export interface SalaryAllowance {
  name: string;
  amount: number;
}

export interface SalarySetting {
  userId: string;
  baseSalary: number;
  allowances: SalaryAllowance[];
  npwp: string | null;
  maritalStatus: MaritalStatus;
  dependents: number;
  bpjsKesehatan: boolean;
  bpjsKetenagakerjaan: boolean;
  bankName: string | null;
  bankAccount: string | null;
}

export interface SalarySettingRecord extends SalarySetting {
  userName: string;
  position: string | null;
  divisionName: string | null;
  status: 'active' | 'inactive';
}

export interface PayrollItem {
  userId: string;
  userName: string;
  position: string | null;
  divisionName: string | null;
  workDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  dailyRate: number;
  baseSalary: number;
  allowanceTotal: number;
  thrAmount: number;
  grossSalary: number;
  jkn: number;
  jht: number;
  jp: number;
  pph21: number;
  manualDeduction: number;
  netIncome: number;
}

export interface PayrollSnapshot {
  baseSalary: number;
  allowances: SalaryAllowance[];
  npwp: string | null;
  maritalStatus: MaritalStatus;
  dependents: number;
  bpjsKesehatan: boolean;
  bpjsKetenagakerjaan: boolean;
  bankName: string | null;
  bankAccount: string | null;
  taxMethod: 'ter' | 'annualized';
  terCategory: string | null;
  terRateBp: number | null;
}

export interface PayrollRecord extends PayrollItem {
  id: number;
  periodYear: number;
  periodMonth: number;
  manualDeductionNote: string | null;
  createdAt: Date;
  snapshot: PayrollSnapshot;
}

export interface PayrollPreviewResponse {
  items: PayrollItem[];
  skipped: { userId: string; userName: string; reason: string }[];
  summary: {
    employeeCount: number;
    totalGross: number;
    totalBpjs: number;
    totalPph21: number;
    totalNet: number;
  };
}

export const MONTH_LABEL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function periodLabel(year: number, month: number): string {
  return `${MONTH_LABEL[month - 1]} ${year}`;
}

const RUPIAH = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export function formatRupiah(value: number): string {
  return `Rp ${RUPIAH.format(value)}`;
}

/** Total potongan (BPJS + PPh 21 + potongan manual) pada satu baris payroll. */
export function totalDeduction(item: PayrollItem): number {
  return item.jkn + item.jht + item.jp + item.pph21 + item.manualDeduction;
}