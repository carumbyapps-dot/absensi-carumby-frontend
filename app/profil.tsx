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
import { colors, font, fontFamily, radius, spacing, typography } from '@/theme';
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
    // Jangan navigasi manual — auth gate di _layout otomatis mengarahkan
    // ke layar Masuk saat status berubah jadi unauthenticated.
    await signOut();
  };

  const avatarOptions: SheetOption[] = [
    { label: 'Pilih dari Galeri', icon: 'images-outline', onPress: () => pickAvatar('library') },
    { label: 'Ambil dari Kamera', icon: 'camera-outline', onPress: () => pickAvatar('camera') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.identity}>
        <Pressable style={styles.avatarWrap} onPress={() => setSheet('avatar')}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.bone} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.bone} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.bone} />
            )}
          </View>
        </Pressable>
        <Text style={styles.name}>{user?.name ?? 'Pengguna'}</Text>
        <Text style={styles.email}>{user?.email ?? '-'}</Text>
        <Text style={styles.avatarHint}>Ketuk avatar untuk mengubah foto profil</Text>
      </View>

      <Text style={styles.sectionTitle}>Pengaturan</Text>

      <View style={styles.group}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="notifications-outline" size={18} color={colors.ink} />
          </View>
          <Text style={styles.settingLabel}>Notifikasi absen</Text>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.ink38, true: colors.lumut }}
            thumbColor={colors.bone}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
          onPress={() => setSheet('password')}
        >
          <View style={styles.settingIcon}>
            <Ionicons name="key-outline" size={18} color={colors.ink} />
          </View>
          <Text style={styles.settingLabel}>Ganti kata sandi</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.ink38} />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        onPress={() => setSheet('logout')}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.red} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>

      <Text style={styles.footer}>ABSEN KILAT V1.0.0</Text>

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
                <ActivityIndicator color={colors.bone} />
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
    backgroundColor: colors.bone,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  identity: {
    paddingVertical: spacing.xl,
  },
  avatarWrap: {
    alignSelf: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.red,
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
    backgroundColor: colors.ink,
    borderWidth: 3,
    borderColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.d2,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  email: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    textAlign: 'center',
    marginTop: 2,
  },
  avatarHint: {
    fontFamily: fontFamily.regular,
    fontSize: font.tiny,
    color: colors.ink38,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  group: {
    borderWidth: 1,
    borderColor: colors.ink12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.ink12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.7,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.red,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  logoutText: {
    ...typography.label,
    color: colors.red,
  },
  footer: {
    ...typography.label,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.ink38,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.ink90,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    ...typography.d3,
    fontSize: 16,
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  modalError: {
    ...typography.label,
    fontSize: 10,
    color: colors.red,
  },
  modalSuccess: {
    ...typography.label,
    fontSize: 10,
    color: colors.lumut,
  },
  modalButton: {
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    ...typography.label,
    color: colors.bone,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalCancelText: {
    ...typography.label,
    color: colors.ink60,
  },
});