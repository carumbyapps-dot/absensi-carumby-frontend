import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AttendanceRecord } from '@/types/attendance';
import { apiFetch, appendPhotoToForm, getErrorMessage, toDateKey } from '@/lib/api';
import { useAuth } from '@/store/auth';

interface RawAttendance {
  id: number;
  type: 'in' | 'out';
  photoPath: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  status: 'on_time' | 'late' | null;
  createdAt: string;
}

interface AttendancePayload {
  attendance: RawAttendance;
}

interface ListPayload {
  date: string;
  count: number;
  attendance: RawAttendance[];
}

function normalizeAttendance(raw: RawAttendance): AttendanceRecord {
  return {
    id: String(raw.id),
    type: raw.type,
    photoPath: raw.photoPath,
    photoUrl: raw.photoUrl,
    latitude: raw.latitude,
    longitude: raw.longitude,
    timestamp: raw.timestamp,
    status: raw.status,
  };
}

export interface AddAttendanceInput {
  type: 'in' | 'out';
  photoUri: string;
  latitude: number | null;
  longitude: number | null;
}

interface AttendanceContextValue {
  getRecordsForDate: (date: Date, force?: boolean) => Promise<AttendanceRecord[]>;
  getRecordById: (id: string, force?: boolean) => Promise<AttendanceRecord | null>;
  addRecord: (input: AddAttendanceInput) => Promise<AttendanceRecord>;
  refreshKey: number;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const byDate = useRef(new Map<string, AttendanceRecord[]>());
  const byId = useRef(new Map<string, AttendanceRecord>());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    byDate.current.clear();
    byId.current.clear();
    setRefreshKey((k) => k + 1);
  }, [userId]);

  const value = useMemo<AttendanceContextValue>(
    () => ({
      getRecordsForDate: async (date, force = false) => {
        const key = toDateKey(date);
        const cached = byDate.current.get(key);
        if (cached && !force) return cached;

        const payload = await apiFetch<ListPayload>(`/api/attendance?date=${key}`);
        const records = payload.attendance.map(normalizeAttendance);
        byDate.current.set(key, records);
        records.forEach((r) => byId.current.set(r.id, r));
        return records;
      },
      getRecordById: async (id, force = false) => {
        const cached = byId.current.get(id);
        if (cached && !force) return cached;

        const payload = await apiFetch<AttendancePayload>(`/api/attendance/${id}`);
        const record = normalizeAttendance(payload.attendance);
        byId.current.set(record.id, record);
        return record;
      },
      addRecord: async ({ type, photoUri, latitude, longitude }) => {
        const form = new FormData();
        form.append('type', type);
        if (latitude !== null && !Number.isNaN(latitude)) {
          form.append('latitude', String(latitude));
        }
        if (longitude !== null && !Number.isNaN(longitude)) {
          form.append('longitude', String(longitude));
        }
        await appendPhotoToForm(form, photoUri);

        const payload = await apiFetch<AttendancePayload>('/api/attendance', {
          method: 'POST',
          body: form,
        });
        const record = normalizeAttendance(payload.attendance);
        byId.current.set(record.id, record);
        byDate.current.delete(toDateKey(new Date()));
        setRefreshKey((k) => k + 1);
        return record;
      },
      refreshKey,
    }),
    [refreshKey],
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendance(): AttendanceContextValue {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error('useAttendance harus dipakai di dalam AttendanceProvider');
  }
  return ctx;
}

interface RecordsState {
  records: AttendanceRecord[] | null;
  loading: boolean;
  error: string | null;
}

export function useRecordsForDate(date: Date) {
  const ctx = useAttendance();
  const key = toDateKey(date);
  const [state, setState] = useState<RecordsState>({ records: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    ctx
      .getRecordsForDate(date)
      .then((records) => {
        if (active) setState({ records, loading: false, error: null });
      })
      .catch((err) => {
        if (active) setState({ records: null, loading: false, error: getErrorMessage(err) });
      });
    return () => {
      active = false;
    };
  }, [key, ctx.refreshKey]);

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const records = await ctx.getRecordsForDate(date, true);
      setState({ records, loading: false, error: null });
    } catch (err) {
      setState({ records: null, loading: false, error: getErrorMessage(err) });
    }
  }, [key, ctx]);

  return { ...state, reload };
}

interface RecordState {
  record: AttendanceRecord | null;
  loading: boolean;
  error: string | null;
}

export function useRecordById(id: string | undefined) {
  const ctx = useAttendance();
  const [state, setState] = useState<RecordState>({ record: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    if (!id) {
      setState({ record: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    ctx
      .getRecordById(id)
      .then((record) => {
        if (active) setState({ record, loading: false, error: null });
      })
      .catch((err) => {
        if (active) setState({ record: null, loading: false, error: getErrorMessage(err) });
      });
    return () => {
      active = false;
    };
  }, [id, ctx.refreshKey]);

  return state;
}