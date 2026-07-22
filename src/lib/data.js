import { createPublicClient } from '@/lib/supabase/public'
import { getJakartaNow, dayKeyFromIndex } from '@/lib/utils'

// Aggregate everything the landing page needs, in one server-side pass.
// Pakai public client (tanpa cookie) supaya hasilnya bisa di-cache/ISR.
export async function getLandingData() {
  const supabase = createPublicClient()
  const now = getJakartaNow()
  const dayKey = dayKeyFromIndex(now.dayIndex) // null on Minggu

  // Custom holiday for today?
  const { data: holiday } = await supabase
    .from('holidays')
    .select('*')
    .eq('tanggal', now.iso)
    .maybeSingle()

  const isLibur = now.dayIndex === 0 || !!holiday

  // Mapel hari ini
  let mapelHariIni = []
  if (dayKey && !isLibur) {
    const { data: sched } = await supabase
      .from('schedules')
      .select('items')
      .eq('day_key', dayKey)
      .maybeSingle()
    mapelHariIni = sched?.items ?? []
  }

  // Piket hari ini
  let piketHariIni = []
  if (dayKey && !isLibur) {
    const { data: piket } = await supabase
      .from('piket')
      .select('students(nama, no_absen)')
      .eq('day_key', dayKey)
    piketHariIni = (piket ?? [])
      .map((r) => r.students)
      .filter(Boolean)
      .sort((a, b) => a.no_absen - b.no_absen)
  }

  const nowIso = new Date().toISOString()

  // Tugas aktif
  const { data: tugas } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Pengumuman biasa yang sedang berlaku
  const { data: pengumuman } = await supabase
    .from('announcements')
    .select('*')
    .eq('kind', 'biasa')
    .order('created_at', { ascending: false })

  const pengumumanAktif = (pengumuman ?? []).filter((a) => {
    const fromOk = !a.active_from || a.active_from <= nowIso
    const untilOk = !a.active_until || a.active_until >= nowIso
    return fromOk && untilOk
  })

  // Popup terbaru milik developer yang berlaku
  const { data: popupRows } = await supabase
    .from('announcements')
    .select('*')
    .eq('kind', 'popup')
    .order('created_at', { ascending: false })
    .limit(1)
  const popup =
    (popupRows ?? []).find((a) => {
      const fromOk = !a.active_from || a.active_from <= nowIso
      const untilOk = !a.active_until || a.active_until >= nowIso
      return fromOk && untilOk
    }) || null

  // Kas menunggak (arrears)
  const { data: arrears } = await supabase.rpc('kas_arrears')
  const menunggak = (arrears ?? []).filter((r) => r.arrears > 0)

  // Ringkasan status kas untuk minggu berjalan (Kamis terkini).
  const { data: kasSetting } = await supabase
    .from('kas_settings').select('start_date').eq('id', 1).maybeSingle()
  const { data: kasPay } = await supabase
    .from('kas_payments').select('student_id, week_date').eq('paid', true)

  // Kamis terakhir yang sudah lewat sejak start_date (null kalau kas belum mulai).
  let currentWeek = null
  {
    const start = new Date((kasSetting?.start_date || now.iso) + 'T00:00:00')
    const cur = new Date(now.date); cur.setHours(0, 0, 0, 0)
    while (cur.getDay() !== 4) cur.setDate(cur.getDate() - 1)
    if (cur >= start) {
      const y = cur.getFullYear(), m = String(cur.getMonth() + 1).padStart(2, '0'), d = String(cur.getDate()).padStart(2, '0')
      currentWeek = `${y}-${m}-${d}`
    }
  }
  const totalSiswa = (arrears ?? []).length
  let sudahLunas = 0
  if (currentWeek) {
    const paidSet = new Set((kasPay ?? []).filter((p) => p.week_date === currentWeek).map((p) => p.student_id))
    sudahLunas = (arrears ?? []).filter((r) => paidSet.has(r.student_id)).length
  }
  const kasSummary = {
    currentWeek,
    totalSiswa,
    sudahLunas,
    belumLunas: totalSiswa - sudahLunas,
    totalTunggakan: (arrears ?? []).reduce((s, r) => s + (r.arrears || 0), 0),
  }

  // Galeri untuk slideshow singkat
  const { data: galeri } = await supabase
    .from('gallery')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return {
    isLibur,
    holiday,
    mapelHariIni,
    piketHariIni,
    tugas: tugas ?? [],
    pengumuman: pengumumanAktif,
    popup,
    menunggak,
    kasSummary,
    galeri: galeri ?? [],
  }
}
