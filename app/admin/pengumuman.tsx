import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { AnnouncementRecord } from '@/types/announcement';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

export default function AdminPengumumanScreen() {
  const [items, setItems] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await apiFetch<{ announcements: AnnouncementRecord[] }>('/api/announcements');
      setItems(r.announcements);
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Lengkapi dulu', 'Judul dan isi pengumuman wajib diisi');
      return;
    }
    setSending(true);
    try {
      const r = await apiFetch<{ message: string }>('/api/announcements', {
        method: 'POST',
        body: { title: title.trim(), body: body.trim() },
      });
      Alert.alert('Terkirim', r.message);
      setTitle('');
      setBody('');
      await load();
    } catch (err) {
      Alert.alert('Gagal mengirim', getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const remove = (a: AnnouncementRecord) => {
    Alert.alert('Hapus pengumuman?', a.title, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/announcements/${a.id}`, { method: 'DELETE' });
            await load();
          } catch (err) {
            Alert.alert('Gagal menghapus', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Kirim Himbauan</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Judul (mis. Himbauan Apel Pagi)"
          placeholderTextColor={colors.ink38}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <TextInput
          style={[styles.input, styles.bodyInput]}
          placeholder="Isi pesan yang akan dilihat seluruh karyawan…"
          placeholderTextColor={colors.ink38}
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={2000}
        />
        <Pressable style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]} onPress={send} disabled={sending}>
          {sending ? (
            <ActivityIndicator color={colors.bone} size="small" />
          ) : (
            <>
              <Ionicons name="megaphone-outline" size={16} color={colors.bone} />
              <Text style={styles.sendBtnText}>Kirim ke Semua Karyawan</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Riwayat ({items.length})</Text>
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Belum ada pengumuman terkirim.</Text>
        </View>
      ) : (
        items.map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardMeta}>{formatWhen(a.createdAt)}</Text>
              </View>
              <Pressable style={({ pressed }) => [styles.delBtn, pressed && styles.pressed]} onPress={() => remove(a)}>
                <Ionicons name="trash-outline" size={16} color={colors.red} />
              </Pressable>
            </View>
            <Text style={styles.cardBody}>{a.body}</Text>
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
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  bodyInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.lg,
  },
  sendBtnText: {
    ...typography.label,
    fontSize: 12,
    color: colors.bone,
  },
  stateBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xl,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
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
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  cardMeta: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  cardBody: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink,
    lineHeight: 20,
  },
  delBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});