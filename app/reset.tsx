import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors, font, radius, spacing } from '@/theme';
import { API_URL, apiFetch, getErrorMessage } from '@/lib/api';
import FormField from '@/components/FormField';

export default function ResetScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const resetToken = typeof token === 'string' && token ? token : null;

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);

  const requestReset = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Format email tidak valid');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/reset`
          : undefined;
      await apiFetch('/api/auth/request-password-reset', {
        method: 'POST',
        auth: false,
        body: { email: email.trim(), ...(redirectTo ? { redirectTo } : {}) },
      });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitNewPassword = async () => {
    if (!resetToken) return;
    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        auth: false,
        body: { newPassword, token: resetToken },
      });
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="dark" />
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>Kata sandi berhasil diubah</Text>
        <Text style={styles.successText}>Silakan masuk dengan kata sandi baru Anda.</Text>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.primaryButtonText}>Ke Halaman Masuk</Text>
        </Pressable>
      </View>
    );
  }

  if (sent) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="dark" />
        <View style={styles.successIcon}>
          <Ionicons name="mail-outline" size={40} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>Tautan reset terkirim</Text>
        <Text style={styles.successText}>
          Jika email terdaftar, tautan reset kata sandi telah dikirim ke {email.trim()}. Pada mode
          pengembangan, tautan juga dicetak di log server backend.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.primaryButtonText}>Kembali ke Masuk</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {resetToken ? 'Buat Kata Sandi Baru' : 'Lupa Kata Sandi'}
            </Text>
            <Text style={styles.subtitle}>
              {resetToken
                ? 'Tentukan kata sandi baru untuk akun Anda.'
                : 'Masukkan email terdaftar untuk menerima tautan reset.'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          {resetToken ? (
            <>
              <FormField
                label="Kata Sandi Baru"
                icon="lock-closed-outline"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Minimal 8 karakter"
                secureTextEntry
                autoCapitalize="none"
              />
              <FormField
                label="Konfirmasi Kata Sandi"
                icon="shield-checkmark-outline"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Ulangi kata sandi"
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          ) : (
            <FormField
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@perusahaan.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={resetToken ? submitNewPassword : requestReset}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Ionicons name="key-outline" size={18} color={colors.white} />
            )}
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Memproses…' : resetToken ? 'Simpan Kata Sandi' : 'Kirim Tautan Reset'}
            </Text>
          </Pressable>

          <View style={styles.links}>
            <Link href="/login" asChild>
              <Pressable style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Kembali ke Masuk</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: font.title,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: font.label,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: font.label,
    color: colors.danger,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  pressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.white,
  },
  links: {
    alignItems: 'center',
  },
  link: {
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.primary,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: font.title,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  successText: {
    fontSize: font.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});