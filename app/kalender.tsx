import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { colors, font, fontFamily, spacing, typography } from '@/theme';
import { formatDateLong, Holiday, HOLIDAY_TYPE_LABEL } from '@/types/leave';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function KalenderScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ holidays: Holiday[] }>(`/api/holidays?year=${year}&month=${month}`);
      setHolidays(res.holidays);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const shift = (delta: number) => {
    const m = month + delta;
    if (m < 1) {
      setMonth(12);
      setYear(year - 1);
    } else if (m > 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(m);
    }
  };

  const holidayKeys = new Set(holidays.map((h) => h.date));

  // Grid kalender: mulai dari hari Minggu (0)
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.monthNav}>
        <Pressable style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]} onPress={() => shift(-1)}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTHS[month - 1]} {year}
        </Text>
        <Pressable style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]} onPress={() => shift(1)}>
          <Ionicons name="chevron-forward" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.cell} />;
          const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isHoliday = holidayKeys.has(key);
          const isToday = key === toKey(new Date());
          return (
            <View key={key} style={[styles.cell, isHoliday && styles.cellHoliday]}>
              <Text style={[styles.dayNum, isHoliday && styles.dayNumHoliday, isToday && styles.dayNumToday]}>
                {day}
              </Text>
              {isHoliday && <View style={styles.holidayDot} />}
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Hari Libur {MONTHS[month - 1]} {year}</Text>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : holidays.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Tidak ada hari libur bulan ini</Text>
          </View>
        ) : (
          holidays.map((h) => (
            <View key={h.id} style={styles.holidayRow}>
              <View style={styles.holidayDate}>
                <Text style={styles.holidayDay}>{h.date.slice(8)}</Text>
                <Text style={styles.holidayMonth}>{MONTHS[Number(h.date.slice(5, 7)) - 1].slice(0, 3)}</Text>
              </View>
              <View style={styles.holidayInfo}>
                <Text style={styles.holidayName}>{h.name}</Text>
                <Text style={styles.holidayMeta}>{formatDateLong(h.date)} · {HOLIDAY_TYPE_LABEL[h.type]}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
    padding: spacing.lg,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.ink12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  monthLabel: {
    ...typography.d3,
    color: colors.ink,
    fontSize: 18,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.label,
    fontSize: 10,
    color: colors.ink60,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.ink12,
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.ink12,
    position: 'relative',
  },
  cellHoliday: {
    backgroundColor: colors.tanah,
  },
  dayNum: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
    color: colors.ink,
  },
  dayNumHoliday: {
    fontFamily: fontFamily.bold,
    color: colors.ink,
  },
  dayNumToday: {
    color: colors.red,
    fontFamily: fontFamily.black,
  },
  holidayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.red,
  },
  list: {
    paddingTop: spacing.xl,
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
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink38,
    paddingVertical: spacing.xxl,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
    paddingVertical: spacing.lg,
  },
  holidayDate: {
    width: 52,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingVertical: spacing.sm,
  },
  holidayDay: {
    fontFamily: fontFamily.black,
    fontSize: font.d3,
    color: colors.ink,
  },
  holidayMonth: {
    ...typography.label,
    fontSize: 9,
    color: colors.ink60,
  },
  holidayInfo: {
    flex: 1,
    gap: 2,
  },
  holidayName: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  holidayMeta: {
    fontFamily: fontFamily.regular,
    fontSize: font.caption,
    color: colors.ink60,
  },
});