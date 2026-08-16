import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { ANNOUNCEMENT_LAST_SEEN_KEY, AnnouncementRecord } from '@/types/announcement';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

export default function PengumumanScreen() {
  const [items, setItems] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await apiFetch<{ announcements: AnnouncementRecord[] }>('/api/announcements');
      setItems(r.announcements);
      if (r.announcements.length > 0) {
        await AsyncStorage.setItem(ANNOUNCEMENT_LAST_SEEN_KEY, String(r.announcements[0].id));
      }
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading && items.length === 0} onRefresh={load} tintColor={colors.ink} />}
    >
      <Text style={styles.sectionLabel}>Pengumuman ({items.length})</Text>

      {loading && items.length === 0 ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.stateBox}>
          <Ionicons name="megaphone-outline" size={22} color={colors.ink38} />
          <Text style={styles.stateText}>Belum ada pengumuman.</Text>
          <Text style={styles.stateText}>Himbauan dari HRD akan muncul di sini.</Text>
        </View>
      ) : (
        items.map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="megaphone" size={16} color={colors.red} />
              <Text style={styles.title}>{a.title}</Text>
            </View>
            <Text style={styles.body}>{a.body}</Text>
            <Text style={styles.meta}>
              {a.authorName} · {formatWhen(a.createdAt)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  stateBox: {
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    ...typography.label,
    fontSize: 13,
    color: colors.ink,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
    lineHeight: 22,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
});