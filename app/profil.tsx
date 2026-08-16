import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaType } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { colors, font, radius, spacing } from '@/theme';
import { useAuth } from '@/store/auth';
import { getErrorMessage } from '@/lib/api';
import OptionSheet, { SheetOption } from '@/components/OptionSheet';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, signOut, uploadAvatar, updateProfile, changePassword } = useAuth();
  const [notifications, setNotifications] = useState(
    user?.notificationPrefs?.attendance !== false,
  );
  const [uploading, setUploading] = useState(false);
  const [sheet, setSheet] = useState<'avatar' | 'logout' | 'password' | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordDone, setPasswordDone] = useState(false);

  const pickAvatar = async (source: 'library' | 'camera') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'] as MediaType[],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };
    const result =
      source === 'library'
        ? await ImagePicker.launchImageLibraryAsync(options)
        : await ImagePicker.launchCameraAsync(options);
    if (!result.canceled && result.assets[0]?.uri) {
      setUploading(true);
      try {
        await uploadAvatar(result.assets[0].uri);
      } finally {
        setUploading(false);
      }
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotifications(value);
    try {
      await updateProfile({ notificationPrefs: { attendance: value } });
    } catch {
      setNotifications((prev) => !prev);
    }
  };

  const doChangePassword = async () => {
    setPasswordBusy(true);
    setPasswordError(null);
    setPasswordDone(false);
    try {
      await changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: '', next: '' });
      setPasswordDone(true);
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setPasswordBusy(false);
    }
  };

  const doLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const avatarOptions: SheetOption[] = [
    { label: 'Pilih dari Galeri', icon: 'images-outline', onPress: () => pickAvatar('library') },
    { label: 'Ambil dari Kamera', icon: 'camera-outline', onPress: () => pickAvatar('camera') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Pressable style={styles.avatarWrap} onPress={() => setSheet('avatar')}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color={colors.white} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.white} />
            )}
          </View>
        </Pressable>
        <Text style={styles.name}>{user?.name ?? 'Pengguna'}</Text>
        <Text style={styles.email}>{user?.email ?? '-'}</Text>
        <Text style={styles.avatarHint}>Ketuk avatar untuk mengubah foto profil</Text>
      </View>

      <Text style={styles.sectionTitle}>Pengaturan</Text>

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.settingLabel}>Notifikasi absen</Text>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
          onPress={() => setSheet('password')}
        >
          <View style={styles.settingIcon}>
            <Ionicons name="key-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.settingLabel}>Ganti kata sandi</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        onPress={() => setSheet('logout')}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>

      <Text style={styles.footer}>Absen Kilat v1.0.0</Text>

      <OptionSheet
        visible={sheet === 'avatar'}
        title="Ubah Foto Profil"
        options={avatarOptions}
        onClose={() => setSheet(null)}
      />

      <OptionSheet
        visible={sheet === 'logout'}
        title="Yakin ingin keluar?"
        options={[
          {
            label: 'Keluar dari Akun',
            icon: 'log-out-outline',
            destructive: true,
            onPress: () => doLogout(),
          },
        ]}
        onClose={() => setSheet(null)}
      />

      <Modal
        visible={sheet === 'password'}
        transparent
        animationType="fade"
        onRequestClose={() => setSheet(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSheet(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Ganti Kata Sandi</Text>

            <TextInput
              style={styles.input}
              placeholder="Kata sandi saat ini"
              secureTextEntry
              autoCapitalize="none"
              value={passwordForm.current}
              onChangeText={(v) => setPasswordForm((p) => ({ ...p, current: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Kata sandi baru (min. 8 karakter)"
              secureTextEntry
              autoCapitalize="none"
              value={passwordForm.next}
              onChangeText={(v) => setPasswordForm((p) => ({ ...p, next: v }))}
            />

            {passwordError && <Text style={styles.modalError}>{passwordError}</Text>}
            {passwordDone && (
              <Text style={styles.modalSuccess}>Kata sandi berhasil diubah.</Text>
            )}

            <Pressable
              style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}
              onPress={doChangePassword}
              disabled={passwordBusy}
            >
              {passwordBusy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.modalButtonText}>Simpan</Text>
              )}
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setSheet(null)}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  avatarWrap: {
    alignSelf: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  email: {
    fontSize: font.label,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  avatarHint: {
    fontSize: font.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  logoutText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.danger,
  },
  footer: {
    fontSize: font.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: colors.text,
  },
  modalError: {
    fontSize: font.label,
    color: colors.danger,
  },
  modalSuccess: {
    fontSize: font.label,
    color: colors.success,
    fontWeight: '700',
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.white,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalCancelText: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});