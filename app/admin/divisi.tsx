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
import { Division } from '@/types/leave';

export default function AdminDivisiScreen() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<Division | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ divisions: Division[] }>('/api/divisions');
      setDivisions(res.divisions);
    } catch (err) {
      Alert.alert('Gagal memuat', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await apiFetch('/api/divisions', { method: 'POST', body: { name } });
      setNewName('');
      await load();
    } catch (err) {
      Alert.alert('Gagal menambah', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiFetch(`/api/divisions/${editing.id}`, {
        method: 'PATCH',
        body: { name: editName.trim() },
      });
      setEditing(null);
      await load();
    } catch (err) {
      Alert.alert('Gagal mengubah', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: Division) => {
    Alert.alert('Hapus divisi?', d.name, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/divisions/${d.id}`, { method: 'DELETE' });
            await load();
          } catch (err) {
            Alert.alert('Gagal menghapus', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Nama divisi baru"
          placeholderTextColor={colors.ink38}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={add}
        />
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          onPress={add}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={colors.bone} size="small" /> : <Ionicons name="add" size={20} color={colors.bone} />}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        divisions.map((d) =>
          editing?.id === d.id ? (
            <View key={d.id} style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                value={editName}
                onChangeText={setEditName}
                autoFocus
              />
              <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} onPress={saveEdit}>
                <Ionicons name="checkmark" size={20} color={colors.ink} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                onPress={() => setEditing(null)}
              >
                <Ionicons name="close" size={20} color={colors.ink38} />
              </Pressable>
            </View>
          ) : (
            <View key={d.id} style={styles.row}>
              <Text style={styles.rowName}>{d.name}</Text>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                onPress={() => {
                  setEditing(d);
                  setEditName(d.name);
                }}
              >
                <Ionicons name="create-outline" size={18} color={colors.ink} />
              </Pressable>
              <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} onPress={() => remove(d)}>
                <Ionicons name="trash-outline" size={18} color={colors.red} />
              </Pressable>
            </View>
          ),
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  addBtn: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
  pressed: {
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
    paddingVertical: spacing.md,
  },
  rowName: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  rowInput: {
    borderWidth: 0,
    padding: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xxl,
  },
});