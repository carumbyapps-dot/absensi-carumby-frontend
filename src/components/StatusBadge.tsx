import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '@/theme';
import { STATUS_LABEL, AttendanceStatus } from '@/types/attendance';

const STATUS_STYLE: Record<
  AttendanceStatus,
  { bg: string; fg: string; dot: string }
> = {
  on_time: { bg: colors.successLight, fg: colors.success, dot: colors.success },
  late: { bg: colors.warningLight, fg: colors.warning, dot: colors.warning },
};

interface Props {
  status: AttendanceStatus | null;
}

export default function StatusBadge({ status }: Props) {
  if (status === null) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.background }]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Selesai</Text>
      </View>
    );
  }

  const style = STATUS_STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <View style={[styles.dot, { backgroundColor: style.dot }]} />
      <Text style={[styles.label, { color: style.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  label: {
    fontSize: font.caption,
    fontWeight: '700',
  },
});