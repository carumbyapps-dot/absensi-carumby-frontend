import { Platform } from 'react-native';
import { API_URL, getToken } from './api';

/**
 * Unduh slip gaji PDF.
 * Web: fetch dengan Authorization → blob → unduh via anchor.
 * Native: tidak didukung di versi ini (kembalikan false agar layar menampilkan
 * pesan bahwa slip tersedia di versi web).
 */
export async function downloadPayrollSlip(id: number): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;

  const res = await fetch(`${API_URL}/api/payroll/slip/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;

  if (Platform.OS !== 'web') {
    return false;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `slip-gaji-${id}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}