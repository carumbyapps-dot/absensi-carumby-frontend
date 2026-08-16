// Sistem desain Carumby — tiga lapis (lihat CLAUDE.md & DESIGN.md)
// Lapis 2 (netral) adalah antarmuka; Lapis 1 (merah) hanya satu aksen per layar;
// Lapis 3 (warna katalog) tidak pernah naik ke sistem.

export const colors = {
  // Lapis 2 — sistem desain
  ink: '#1E2622', // Rimba — teks utama, latar gelap, semua border
  bone: '#EDEBE5', // Kabut — latar halaman
  lumut: '#4A5A46', // aksen sekunder, tag kategori
  batu: '#6E7480', // teks sekunder besar, ikon nonaktif
  tanah: '#C3AB92', // blok latar, pembatas hangat — bukan warna teks

  // Lapis 1 — identitas
  red: '#C1121F', // Merah UI — fill tombol utama, teks merah kecil (6,23:1)
  redBrand: '#ED1C24', // Merah Carumby — logo & momen brand besar saja

  // Alpha (diverifikasi setelah komposit)
  ink90: 'rgba(30,38,34,0.9)',
  ink60: 'rgba(30,38,34,0.7)',
  ink38: 'rgba(30,38,34,0.68)',
  ink12: 'rgba(30,38,34,0.12)', // hairline hanya
  bone90: 'rgba(237,235,229,0.9)',
  bone55: 'rgba(237,235,229,0.55)',
  bone16: 'rgba(237,235,229,0.16)', // hairline hanya
} as const;

// Tag status — Lumut (tepat waktu) dan Merah UI (terlambat) dari sistem
export const statusColors = {
  on_time: { bg: colors.lumut, fg: colors.bone },
  late: { bg: colors.red, fg: colors.bone },
  none: { bg: colors.ink12, fg: colors.ink38 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Tidak ada kartu, tidak ada elevasi — grouping lewat hairline & ruang
export const radius = {
  none: 0,
  sm: 2,
  full: 999,
} as const;

export const fontFamily = {
  regular: 'Archivo_400Regular',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  black: 'Archivo_800ExtraBold',
} as const;

export const font = {
  d1: 30,
  d2: 26,
  d3: 20,
  heading: 18,
  body: 15,
  label: 11,
  caption: 12,
  tiny: 10,
} as const;

// Semua label, kontrol, dan display: UPPERCASE dengan tracking positif
export const typography = {
  label: {
    fontFamily: fontFamily.bold,
    fontSize: font.label,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  d3: {
    fontFamily: fontFamily.black,
    fontSize: font.d3,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  d2: {
    fontFamily: fontFamily.black,
    fontSize: font.d2,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  d1: {
    fontFamily: fontFamily.black,
    fontSize: font.d1,
    letterSpacing: 0.2,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: font.body,
  },
  price: {
    fontFamily: fontFamily.black,
    fontSize: font.body,
    letterSpacing: 1.2,
  },
} as const;

// Angka selalu tabular agar sejajar dalam kolom
export const numerals: { fontVariant: 'tabular-nums'[] } = {
  fontVariant: ['tabular-nums'],
};
