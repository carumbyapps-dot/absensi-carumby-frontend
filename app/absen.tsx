import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
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
import { colors, font, fontFamily, numerals, spacing, typography } from '@/theme';
import { useAttendance } from '@/store/attendance';
import { useNow, formatClock } from '@/hooks/useNow';
import { apiFetch, getErrorMessage, toDateKey } from '@/lib/api';
import type { WorkScheduleRecord } from '@/types/schedule';
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
  const [shift, setShift] = useState<{ startTime: string; endTime: string } | null>(null);

  useEffect(() => {
    const today = toDateKey(new Date());
    const nowD = new Date();
    apiFetch<{ schedules: WorkScheduleRecord[] }>(
      `/api/schedules/mine?year=${nowD.getFullYear()}&month=${nowD.getMonth() + 1}`,
    )
      .then((r) => {
        const s = r.schedules.find((x) => x.date === today);
        setShift(s ? { startTime: s.startTime, endTime: s.endTime } : null);
      })
      .catch(() => {
        setShift(null);
      });
  }, []);

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
            <Ionicons name="camera-outline" size={40} color={colors.bone} />
            <Text style={styles.cameraFallbackTitle}>Kamera Diperlukan</Text>
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
          <Ionicons name="close" size={22} color={colors.bone} />
        </Pressable>

        <View style={[styles.cameraTopLabel, { top: insets.top + spacing.md + 48 }]}>
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
          <Ionicons name="checkmark" size={40} color={colors.bone} />
        </View>
        <Text style={styles.successTitle}>
          {savedRecord.type === 'in' ? 'Absen Masuk Berhasil' : 'Absen Keluar Berhasil'}
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
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.confirmTitle}>Konfirmasi {modeLabel}</Text>
        <View style={styles.confirmBack} />
      </View>

      <ScrollView
        contentContainerStyle={styles.confirmBody}
        showsVerticalScrollIndicator={false}
      >
        {photo && (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
          </View>
        )}

        <View style={styles.block}>
          <View style={styles.blockRow}>
            <Ionicons name="location" size={16} color={colors.ink} />
            <Text style={styles.blockLabel}>Lokasi GPS</Text>
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
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.locationText}>Mendeteksi lokasi…</Text>
            </View>
          ) : (
            <View style={styles.locationBox}>
              <Ionicons
                name={locationState === 'denied' ? 'lock-closed-outline' : 'alert-circle-outline'}
                size={20}
                color={colors.ink38}
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

        <View style={styles.block}>
          <View style={styles.blockRow}>
            <Ionicons name="time-outline" size={16} color={colors.ink} />
            <Text style={styles.blockLabel}>Waktu Dicatat</Text>
          </View>
          <Text style={styles.timeText}>{formatClock(now)}</Text>
        </View>

        <View style={styles.block}>
          <View style={styles.blockRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.ink} />
            <Text style={styles.blockLabel}>Jadwal Hari Ini</Text>
          </View>
          <Text style={styles.scheduleText}>
            {shift ? `Shift ${shift.startTime}–${shift.endTime}` : 'Jam kerja standar'}
          </Text>
          {mode === 'out' && (
            <Text style={styles.scheduleNote}>
              Keluar sebelum jam selesai akan tercatat sebagai Pulang Awal.
            </Text>
          )}
        </View>

        {submitError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
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
            <Ionicons name="refresh" size={16} color={colors.ink} />
            <Text style={styles.secondaryButtonText}>Ulangi</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.bone} />
            ) : (
              <Ionicons name="arrow-forward" size={16} color={colors.bone} />
            )}
            <Text style={styles.primaryButtonText}>{submitting ? 'Mengirim…' : 'Kirim'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  cameraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  cameraFallbackTitle: {
    ...typography.d3,
    color: colors.bone,
  },
  cameraFallbackText: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.bone55,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  permissionButtonText: {
    ...typography.label,
    color: colors.bone,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.bone16,
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
    ...typography.label,
    color: colors.bone,
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
    ...numerals,
    fontFamily: fontFamily.black,
    fontSize: font.d2,
    color: colors.bone,
    letterSpacing: 0.4,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.bone,
  },
  cameraHint: {
    fontFamily: fontFamily.regular,
    fontSize: font.tiny,
    color: colors.bone55,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  confirmBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    ...typography.d3,
    fontSize: 16,
    color: colors.ink,
  },
  confirmBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  photoWrap: {
    borderWidth: 1,
    borderColor: colors.ink12,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.ink12,
  },
  block: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
    gap: spacing.md,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  blockLabel: {
    ...typography.label,
    color: colors.ink,
  },
  coordsText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  locationBox: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  locationText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    textAlign: 'center',
  },
  retryText: {
    ...typography.label,
    color: colors.red,
  },
  timeText: {
    ...numerals,
    fontFamily: fontFamily.black,
    fontSize: font.d2,
    color: colors.ink,
    letterSpacing: 0.4,
  },
  scheduleText: {
    ...numerals,
    fontFamily: fontFamily.bold,
    fontSize: font.body,
    color: colors.ink,
  },
  scheduleNote: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
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
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: spacing.lg,
  },
  secondaryButtonText: {
    ...typography.label,
    color: colors.ink,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
  },
  primaryButtonText: {
    ...typography.label,
    color: colors.bone,
  },
  successIcon: {
    width: 76,
    height: 76,
    backgroundColor: colors.lumut,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...typography.d1,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink60,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  successButtonText: {
    ...typography.label,
    color: colors.bone,
  },
});