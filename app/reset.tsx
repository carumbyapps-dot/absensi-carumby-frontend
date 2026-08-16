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
import { colors, font, fontFamily, spacing, typography } from '@/theme';
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
          <Ionicons name="checkmark" size={32} color={colors.bone} />
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
          <Ionicons name="mail-outline" size={32} color={colors.bone} />
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
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
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

        <View style={styles.group}>
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
              <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={resetToken ? submitNewPassword : requestReset}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.bone} />
            ) : (
              <Ionicons name="key-outline" size={18} color={colors.bone} />
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
    backgroundColor: colors.bone,
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
    borderWidth: 1,
    borderColor: colors.ink12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.d3,
    fontSize: 18,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  group: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.red,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.red,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
  },
  pressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    ...typography.label,
    color: colors.bone,
  },
  links: {
    alignItems: 'center',
  },
  link: {
    paddingVertical: spacing.xs,
  },
  linkText: {
    ...typography.label,
    color: colors.red,
  },
  successIcon: {
    width: 72,
    height: 72,
    backgroundColor: colors.lumut,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...typography.d2,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
  },
  successText: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink60,
    textAlign: 'center',
    lineHeight: 22,
  },
});