import { StyleSheet, Text, View } from 'react-native';
import { statusColors, typography } from '@/theme';
import { LEAVE_STATUS_LABEL, LeaveStatus } from '@/types/leave';

const COLORS: Record<LeaveStatus, keyof typeof statusColors> = {
  pending: 'late',
  approved: 'on_time',
  rejected: 'late',
  cancelled: 'none',
};

export default function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const style = statusColors[COLORS[status]];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.label, { color: style.fg }]}>{LEAVE_STATUS_LABEL[status]}</Text>
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
