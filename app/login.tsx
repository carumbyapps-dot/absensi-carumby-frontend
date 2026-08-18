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
import { colors, font, fontFamily, radius, spacing, typography } from '@/theme';
import { useAuth, authErrorMessage, isEmailNotVerifiedError } from '@/store/auth';
import FormField from '@/components/FormField';
import BrandMark from '@/components/BrandMark';

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
      router.replace('/');
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
          <BrandMark size={72} />
          <Text style={styles.brandTitle}>ANTRAC</Text>
          <Text style={styles.brandTagline}>Antara aku dan Carumby</Text>
          <Text style={styles.brandSubtitle}>
            Catat kehadiran dengan cepat, aman, dan mudah
          </Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Masuk</Text>
          <Text style={styles.groupSubtitle}>Gunakan email dan kata sandi akun Anda.</Text>

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
              <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {emailNotVerified && (
            <Pressable
              style={({ pressed }) => [styles.resendButton, pressed && styles.pressed]}
              onPress={resend}
              disabled={submitting}
            >
              <Ionicons name="mail-unread-outline" size={18} color={colors.red} />
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
              <ActivityIndicator color={colors.bone} />
            ) : (
              <Ionicons name="log-in-outline" size={18} color={colors.bone} />
            )}
            <Text style={styles.primaryButtonText}>{submitting ? 'Memproses…' : 'Masuk'}</Text>
          </Pressable>

          <View style={styles.links}>
            <Text style={styles.linkNote}>
              Akun dibuat admin & lupa kata sandi ditangani HRD — hubungi HRD bila butuh bantuan.
            </Text>
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
  brandTitle: {
    ...typography.d2,
    fontSize: 24,
    color: colors.ink,
  },
  brandTagline: {
    fontFamily: fontFamily.semibold,
    fontSize: font.body,
    color: colors.ink,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink60,
    textAlign: 'center',
  },
  group: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  groupTitle: {
    ...typography.d3,
    fontSize: 18,
    color: colors.ink,
  },
  groupSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    marginTop: -spacing.sm,
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
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  resendText: {
    ...typography.label,
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
  linkNote: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    textAlign: 'center',
  },
  link: {
    paddingVertical: spacing.xs,
  },
  linkText: {
    ...typography.label,
    color: colors.red,
  },
});