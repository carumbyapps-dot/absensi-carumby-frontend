import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/** /admin langsung menampilkan dasbor statistik. Menu lengkap di /admin/menu. */
export default function AdminIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/statistik');
  }, [router]);

  return null;
}
