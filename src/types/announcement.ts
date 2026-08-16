// Tipe domain Fase 5 — pengumuman (himbauan HRD).

export interface AnnouncementRecord {
  id: number;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
}

export const ANNOUNCEMENT_LAST_SEEN_KEY = 'absenkilat.lastSeenAnnouncementId';
