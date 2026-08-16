import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraCapturedPicture, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '@/theme';
import { useAttendance } from '@/store/attendance';
import { useNow, formatClock } from '@/hooks/useNow';
import { getErrorMessage } from '@/lib/api';
import { AttendanceRecord } from '@/types/attendance';
import MapPreview from '@/components/MapPreview';

type Step = 'camera' | 'confirm' | 'success';

interface Photo {
  uri: string;
  width: number;
  height: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
}

type LocationState = 'loading' | 'ok' | 'denied' | 'error';

function formatSuccessTime(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${time}, ${date}`;
}

export default function AbsenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode = modeParam === 'out' ? 'out' : 'in';
  const modeLabel = mode === 'in' ? 'Absen Masuk' : 'Absen Keluar';

  const { addRecord } = useAttendance();
  const now = useNow();

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<Step>('camera');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedRecord, setSavedRecord] = useState<AttendanceRecord | null>(null);

  const captureLocation = async () => {
    setLocationState('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      setLocationState('ok');
    } catch {
      setLocationState('error');
    }
  };

  useEffect(() => {
    captureLocation();
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const pic = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setPhoto({ uri: pic.uri, width: pic.width, height: pic.height });
    setStep('confirm');
  };

  const submit = async () => {
    if (!photo) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const record = await addRecord({
        type: mode,
        photoUri: photo.uri,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      });
      setSavedRecord(record);
      setStep('success');
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />

        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="front"
            mirror
          />
        ) : (
          <View style={[styles.cameraFallback, { paddingTop: insets.top }]}>
            <Ionicons name="camera-outline" size={48} color={colors.white} />
            <Text style={styles.cameraFallbackTitle}>Kamera diperlukan</Text>
            <Text style={styles.cameraFallbackText}>
              Izinkan akses kamera untuk mengambil foto selfie sebagai bukti kehadiran.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}
              onPress={() => requestPermission()}
            >
              <Text style={styles.permissionButtonText}>Izinkan Kamera</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={[styles.closeButton, { top: insets.top + spacing.md }]}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={26} color={colors.white} />
        </Pressable>

        <View style={[styles.cameraTopLabel, { top: insets.top + spacing.md + 52 }]}>
          <Text style={styles.cameraTopLabelText}>{modeLabel}</Text>
        </View>

        <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.cameraClock}>{formatClock(now)}</Text>
          <Pressable
            style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
            onPress={takePhoto}
            disabled={!permission?.granted}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          <Text style={styles.cameraHint}>Posisikan wajah di tengah frame</Text>
        </View>
      </View>
    );
  }

  if (step === 'success' && savedRecord) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={44} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>
          {savedRecord.type === 'in' ? 'Absen Masuk berhasil' : 'Absen Keluar berhasil'}
        </Text>
        <Text style={styles.successSubtitle}>
          {savedRecord.type === 'in' ? 'Masuk' : 'Keluar'} pukul{' '}
          {formatSuccessTime(savedRecord.timestamp)}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.successButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.successButtonText}>Kembali ke Beranda</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.confirmHeader}>
        <Pressable onPress={() => router.back()} style={styles.confirmBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.confirmTitle}>Konfirmasi {modeLabel}</Text>
        <View style={styles.confirmBack} />
      </View>

      <View style={styles.confirmBody}>
        {photo && (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.cardLabel}>Lokasi GPS</Text>
          </View>

          {locationState === 'ok' && location ? (
            <>
              <MapPreview
                latitude={location.latitude}
                longitude={location.longitude}
                height={140}
              />
              <Text style={styles.coordsText}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </>
          ) : locationState === 'loading' ? (
            <View style={styles.locationBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.locationText}>Mendeteksi lokasi…</Text>
            </View>
          ) : (
            <View style={styles.locationBox}>
              <Ionicons
                name={
                  locationState === 'denied' ? 'lock-closed-outline' : 'alert-circle-outline'
                }
                size={22}
                color={colors.warning}
              />
              <Text style={styles.locationText}>
                {locationState === 'denied'
                  ? 'Izin lokasi ditolak. Absen tetap bisa dikirim tanpa koordinat.'
                  : 'Gagal mendeteksi lokasi.'}
              </Text>
              <Pressable onPress={captureLocation}>
                <Text style={styles.retryText}>Coba lagi</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.cardLabel}>Waktu dicatat</Text>
          </View>
          <Text style={styles.timeText}>{formatClock(now)}</Text>
        </View>

        {submitError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={() => {
              setPhoto(null);
              setStep('camera');
            }}
            disabled={submitting}
          >
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Ulangi</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={colors.white} />
            )}
            <Text style={styles.primaryButtonText}>{submitting ? 'Mengirim…' : 'Kirim'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
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
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  cameraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  cameraFallbackTitle: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.white,
  },
  cameraFallbackText: {
    fontSize: font.body,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  permissionButtonText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTopLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraTopLabelText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.white,
  },
  cameraBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: spacing.lg,
  },
  cameraClock: {
    fontSize: font.title,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  cameraHint: {
    fontSize: font.caption,
    color: '#CBD5E1',
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  confirmBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  confirmBody: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  photoWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#E9ECF5',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardLabel: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.text,
  },
  coordsText: {
    fontSize: font.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  locationBox: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  locationText: {
    fontSize: font.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: font.label,
    fontWeight: '700',
    color: colors.primary,
  },
  timeText: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  secondaryButtonText: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  primaryButtonText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.white,
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
  successSubtitle: {
    fontSize: font.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  successButtonText: {
    fontSize: font.body,
    fontWeight: '800',
    color: colors.white,
  },
});