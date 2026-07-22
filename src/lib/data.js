import { createClient } from '@/lib/supabase/server'
import { getJakartaNow, dayKeyFromIndex } from '@/lib/utils'

// Aggregate everything the landing page needs, in one server-side pass.
export async function getLandingData() {
  const supabase = await createClient()
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
    galeri: galeri ?? [],
  }
}
