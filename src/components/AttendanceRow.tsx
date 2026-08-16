import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, font, radius, spacing } from '@/theme';
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
  const icon = isIn ? 'arrow-up-circle' : 'arrow-down-circle';
  const iconColor = isIn ? colors.success : colors.primary;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push({ pathname: '/detail', params: { id: record.id } })}
    >
      <View style={[styles.iconWrap, { backgroundColor: isIn ? colors.successLight : colors.primaryLight }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{TYPE_LABEL[record.type]}</Text>
        <Text style={styles.subtitle}>{formatTime(record.timestamp)}</Text>
      </View>
      <StatusBadge status={record.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: font.label,
    color: colors.textSecondary,
  },
});
