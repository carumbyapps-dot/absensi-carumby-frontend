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
import { useAuth, authErrorMessage } from '@/store/auth';
import FormField from '@/components/FormField';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Format email tidak valid');
      return;
    }
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signUp(name.trim(), email.trim(), password);
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="dark" />
        <View style={styles.successIcon}>
          <Ionicons name="mail-outline" size={40} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>Akun berhasil dibuat</Text>
        <Text style={styles.successText}>
          Silakan periksa email {email.trim()} untuk verifikasi. Pada mode pengembangan, tautan
          verifikasi juga dicetak di log server backend.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.primaryButtonText}>Ke Halaman Masuk</Text>
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
            <Text style={styles.title}>Buat Akun</Text>
            <Text style={styles.subtitle}>
              Daftar untuk mulai mencatat kehadiran Anda.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <FormField
            label="Nama Lengkap"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            placeholder="Nama Anda"
            autoCapitalize="words"
          />

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

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Ionicons name="person-add-outline" size={18} color={colors.white} />
            )}
            <Text style={styles.primaryButtonText}>{submitting ? 'Mendaftar…' : 'Daftar'}</Text>
          </Pressable>

          <View style={styles.links}>
            <Link href="/login" asChild>
              <Pressable style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <Text style={styles.linkText}>Sudah punya akun? Masuk</Text>
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