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
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors, font, radius, spacing } from '@/theme';
import { useAuth, authErrorMessage, isEmailNotVerifiedError } from '@/store/auth';
import FormField from '@/components/FormField';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, resendVerification } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi');
      return;
    }
    setSubmitting(true);
    setError(null);
    setEmailNotVerified(false);
    setResent(false);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
      setEmailNotVerified(isEmailNotVerifiedError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await resendVerification(email.trim());
      setResent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="checkmark-circle" size={36} color={colors.white} />
          </View>
          <Text style={styles.brandTitle}>Absen Kilat</Text>
          <Text style={styles.brandSubtitle}>
            Catat kehadiranmu dengan cepat, aman, dan mudah
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk</Text>
          <Text style={styles.cardSubtitle}>Gunakan email dan kata sandi akun Anda.</Text>

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

          <FormField
            label="Kata Sandi"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Kata sandi Anda"
            secureTextEntry
            autoCapitalize="none"
          />

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {emailNotVerified && (
            <Pressable
              style={({ pressed }) => [styles.resendButton, pressed && styles.pressed]}
              onPress={resend}
              disabled={submitting}
            >
              <Ionicons name="mail-unread-outline" size={18} color={colors.primary} />
              <Text style={styles.resendText}>
                {resent ? 'Email verifikasi terkirim ulang' : 'Kirim ulang email verifikasi'}
              </Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Ionicons name="log-in-outline" size={18} color={colors.white} />
            )}
            <Text style={styles.primaryButtonText}>{submitting ? 'Memproses…' : 'Masuk'}</Text>
          </Pressable>

          <View style={styles.links}>
            <Link href="/reset" asChild>
              <Pressable style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Lupa kata sandi?</Text>
              </Pressable>
            </Link>
            <Link href="/register" asChild>
              <Pressable style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Belum punya akun? Daftar</Text>
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
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  brandSubtitle: {
    fontSize: font.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardTitle: {
    fontSize: font.title,
    fontWeight: '800',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: font.label,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
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
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  resendText: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.primary,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  link: {
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.primary,
  },
});