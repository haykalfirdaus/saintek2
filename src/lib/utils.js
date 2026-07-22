// Shared helpers used across the app.

export const HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  "Jumat",
  'Sabtu',
]

// School days: Senin (1) .. Sabtu (6). Minggu (0) is always off by default.
export const WEEKDAY_KEYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

// Zona waktu kelas — WITA (UTC+8). Ubah di sini kalau pindah zona.
export const APP_TZ = 'Asia/Makassar'

// Kembalikan tanggal lokal (WITA) sebagai { date, iso, dayIndex, dayName }.
export function getJakartaNow() {
  const now = new Date()
  // Konversi ke zona app apa pun timezone server-nya.
  const local = new Date(
    now.toLocaleString('en-US', { timeZone: APP_TZ })
  )
  const dayIndex = local.getDay() // 0=Minggu
  return {
    date: local,
    iso: toISODate(local),
    dayIndex,
    dayName: HARI[dayIndex],
  }
}

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTanggalLengkap(d) {
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatRupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID')
}

// Map dayIndex (0=Minggu..6=Sabtu) to the weekday key used in schedule tables.
export function dayKeyFromIndex(dayIndex) {
  if (dayIndex === 0) return null // Minggu
  return WEEKDAY_KEYS[dayIndex - 1]
}

/*
  Kas rule: Rp5.000 per minggu, ditagih tiap Kamis.
  Count how many "Kamis" (billing events) have passed from the class start date
  up to and including today. Each unpaid Kamis => Rp5.000 tunggakan.
*/
export const KAS_PER_MINGGU = 5000

export function countThursdaysBetween(startISO, endDate) {
  const start = new Date(startISO + 'T00:00:00')
  const end = new Date(endDate)
  if (isNaN(start) || end < start) return 0
  let count = 0
  const cur = new Date(start)
  // advance to first Thursday >= start
  while (cur.getDay() !== 4) cur.setDate(cur.getDate() + 1)
  while (cur <= end) {
    count++
    cur.setDate(cur.getDate() + 7)
  }
  return count
}

// Tailwind class merge helper (tiny, no dependency).
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
