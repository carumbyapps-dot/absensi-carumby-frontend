import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Archivo_400Regular, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { AuthProvider, useAuth } from '@/store/auth';
import { AttendanceProvider } from '@/store/attendance';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AttendanceProvider>
        <RootNavigator />
      </AttendanceProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#EDEBE5' },
        }}
      >
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="index" />
          <Stack.Screen name="absen" />
          <Stack.Screen name="riwayat" options={{ headerShown: true, title: 'Riwayat Absen' }} />
          <Stack.Screen name="detail" options={{ headerShown: true, title: 'Detail Absen' }} />
          <Stack.Screen name="profil" options={{ headerShown: true, title: 'Profil Saya' }} />
          <Stack.Screen name="cuti" options={{ headerShown: true, title: 'Cuti & Izin' }} />
          <Stack.Screen name="cuti-form" options={{ headerShown: true, title: 'Ajukan Cuti / Izin' }} />
          <Stack.Screen name="kalender" options={{ headerShown: true, title: 'Kalender Libur' }} />
          <Stack.Screen name="gaji" options={{ headerShown: true, title: 'Gaji & Slip' }} />
          <Stack.Screen name="pengumuman" options={{ headerShown: true, title: 'Pengumuman' }} />
          <Stack.Screen name="admin/index" options={{ headerShown: true, title: 'Panel Admin' }} />
          <Stack.Screen name="admin/approve" options={{ headerShown: true, title: 'Persetujuan Cuti' }} />
          <Stack.Screen name="admin/divisi" options={{ headerShown: true, title: 'Kelola Divisi' }} />
          <Stack.Screen name="admin/karyawan" options={{ headerShown: true, title: 'Data Karyawan' }} />
          <Stack.Screen name="admin/libur" options={{ headerShown: true, title: 'Kelola Hari Libur' }} />
          <Stack.Screen name="admin/jadwal" options={{ headerShown: true, title: 'Jadwal Kerja' }} />
          <Stack.Screen name="admin/rekap" options={{ headerShown: true, title: 'Rekap Absensi' }} />
          <Stack.Screen name="admin/gaji" options={{ headerShown: true, title: 'Kelola Gaji' }} />
          <Stack.Screen name="admin/payroll" options={{ headerShown: true, title: 'Payroll' }} />
          <Stack.Screen name="admin/pengumuman" options={{ headerShown: true, title: 'Kirim Pengumuman' }} />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" options={{ headerShown: true, title: 'Daftar Akun' }} />
          <Stack.Screen name="reset" options={{ headerShown: true, title: 'Atur Ulang Kata Sandi' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}