import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontFamily, font, numerals, spacing, typography } from '@/theme';
import { AttendanceRecord, TYPE_LABEL } from '@/types/attendance';
import StatusBadge from './StatusBadge';

interface Props {
  record: AttendanceRecord;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceRow({ record }: Props) {
  const router = useRouter();
  const isIn = record.type === 'in';
  const icon = isIn ? 'arrow-up' : 'arrow-down';
  const iconColor = isIn ? colors.lumut : colors.ink;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push({ pathname: '/detail', params: { id: record.id } })}
    >
      <View style={[styles.iconWrap, { borderColor: isIn ? colors.lumut : colors.ink }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.title}>{TYPE_LABEL[record.type]}</Text>
      <Text style={styles.time}>{formatTime(record.timestamp)}</Text>
      <StatusBadge status={record.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  pressed: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    ...typography.label,
    color: colors.ink,
    fontSize: 12,
  },
  time: {
    ...numerals,
    fontFamily: fontFamily.semibold,
    fontSize: font.body,
    color: colors.ink,
  },
});