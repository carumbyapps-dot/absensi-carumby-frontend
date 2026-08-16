import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, font, fontFamily, numerals, spacing, typography } from '@/theme';
import { useRecordsForDate } from '@/store/attendance';
import AttendanceRow from '@/components/AttendanceRow';

const DAY_ABBR = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAYS_BACK = 14;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildDayStrip(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = DAYS_BACK; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

export default function RiwayatScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showPicker, setShowPicker] = useState(false);
  const { records, loading, error, reload } = useRecordsForDate(selectedDate);

  const days = buildDayStrip();
  const isToday = isSameDay(selectedDate, new Date());
  const isEmpty = !records || records.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.stripRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {days.map((day) => {
            const selected = isSameDay(day, selectedDate);
            return (
              <Pressable
                key={day.toISOString()}
                style={({ pressed }) => [
                  styles.dayChip,
                  selected && styles.dayChipSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[styles.dayAbbr, selected && styles.dayTextSelected]}>
                  {DAY_ABBR[day.getDay()]}
                </Text>
                <Text style={[styles.dayNum, selected && styles.dayTextSelected]}>
                  {day.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={({ pressed }) => [styles.calendarButton, pressed && styles.pressed]}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.dateLabel}>{formatLabel(selectedDate).toUpperCase()}</Text>
        {records && records.length > 0 && (
          <Text style={styles.countLabel}>{records.length} catatan</Text>
        )}
      </View>

      {showPicker && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : Platform.OS === 'web' ? 'default' : 'calendar'}
            onChange={(event, date) => {
              setShowPicker(false);
              if (event.type !== 'dismissed' && date) setSelectedDate(date);
            }}
          />
          {Platform.OS === 'ios' && (
            <Pressable style={styles.pickerDone} onPress={() => setShowPicker(false)}>
              <Text style={styles.pickerDoneText}>Selesai</Text>
            </Pressable>
          )}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && records === null}
            onRefresh={() => reload()}
            tintColor={colors.ink}
          />
        }
      >
        {loading && records === null ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.stateText}>Memuat data absen…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.ink38} />
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={() => reload()}>
              <Text style={styles.retryText}>Coba lagi</Text>
            </Pressable>
          </View>
        ) : isEmpty ? (
          <View style={styles.stateBox}>
            <Ionicons
              name={isToday ? 'calendar-clear-outline' : 'folder-open-outline'}
              size={28}
              color={colors.ink38}
            />
            <Text style={styles.stateText}>
              {isToday ? 'Belum ada absen hari ini' : 'Tidak ada catatan absen di tanggal ini'}
            </Text>
          </View>
        ) : (
          <View>
            {records.map((record) => (
              <AttendanceRow key={record.id} record={record} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  stripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  strip: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  dayChip: {
    width: 52,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.ink12,
    backgroundColor: colors.bone,
  },
  dayChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dayAbbr: {
    ...typography.label,
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.ink60,
  },
  dayNum: {
    ...numerals,
    fontFamily: fontFamily.bold,
    fontSize: font.body,
    color: colors.ink,
  },
  dayTextSelected: {
    color: colors.bone,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: colors.ink12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  dateLabel: {
    ...typography.d3,
    fontSize: 14,
    letterSpacing: 0.8,
    color: colors.ink,
    flex: 1,
  },
  countLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: font.caption,
    color: colors.ink60,
  },
  pickerWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    padding: spacing.md,
  },
  pickerDoneText: {
    ...typography.label,
    color: colors.red,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stateBox: {
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xxl,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
    textAlign: 'center',
  },
  retryText: {
    ...typography.label,
    color: colors.red,
  },
});