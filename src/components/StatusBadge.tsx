import { StyleSheet, Text, View } from 'react-native';
import { statusColors, typography } from '@/theme';
import { STATUS_LABEL, AttendanceStatus } from '@/types/attendance';

interface Props {
  status: AttendanceStatus | null;
}

export default function StatusBadge({ status }: Props) {
  const style = status ? statusColors[status] : statusColors.none;
  const label = status ? STATUS_LABEL[status] : 'Belum Ada Status';

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.label, { color: style.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 0.9,
  },
});