import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { API_URL, getToken } from './api';

/**
 * Unduh/salin konten teks (CSV atau lainnya).
 * Web: unduh sebagai file (return true). Native: salin ke clipboard (return false).
 */
export async function downloadCsvContent(filename: string, content: string): Promise<boolean> {
  const text = content.replace(/^\uFEFF/, '');
  if (Platform.OS === 'web') {
    const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return true;
  }
  await Clipboard.setStringAsync(text);
  return false;
}

/**
 * Ambil isi CSV dari endpoint terproteksi.
 * Web: unduh langsung sebagai file. Native: salin ke clipboard (return false).
 */
export async function downloadCsv(path: string): Promise<boolean | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const text = (await res.text()).replace(/^\uFEFF/, '');
  const filename = (path.split('/').pop()?.split('?')[0] ?? 'export') + '.csv';
  return downloadCsvContent(filename, text);
}

/** Impor CSV dengan menempel teks (dipakai semua layar admin). */
export async function importCsv(
  path: string,
  body: Record<string, unknown>,
): Promise<{ message: string } | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(data.message ?? data.error ?? `Import gagal (${res.status})`);
  }
  return (await res.json()) as { message: string };
}