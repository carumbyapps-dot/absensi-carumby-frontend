import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/store/auth';
import { AttendanceProvider } from '@/store/attendance';
import { colors, font, radius, spacing } from '@/theme';

function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <StatusBar style="dark" />
        <View style={styles.splashIcon}>
          <Ionicons name="checkmark-circle" size={40} color={colors.white} />
        </View>
        <Text style={styles.splashTitle}>Absen Kilat</Text>
        <ActivityIndicator color={colors.primary} style={styles.splashLoader} />
      </View>
    );
  }

  const isAuthed = status === 'authenticated';

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F6F7FB' },
        }}
      >
        <Stack.Protected guard={isAuthed}>
          <Stack.Screen name="index" />
          <Stack.Screen name="absen" />
          <Stack.Screen name="riwayat" options={{ headerShown: true, title: 'Riwayat Absen' }} />
          <Stack.Screen name="detail" options={{ headerShown: true, title: 'Detail Absen' }} />
          <Stack.Screen name="profil" options={{ headerShown: true, title: 'Profil Saya' }} />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthed}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="reset" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <RootNavigator />
      </AttendanceProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  splashIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    fontSize: font.title,
    fontWeight: '800',
    color: colors.text,
  },
  splashLoader: {
    marginTop: spacing.md,
  },
});