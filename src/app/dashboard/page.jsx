import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentDashboard } from './student-dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Akun admin/pengurus (punya profiles) → arahkan ke panel admin.
  const { data: adminProfile } = await supabase
    .from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (adminProfile) redirect('/admin')

  // Data siswa yang tertaut ke akun ini.
  const { data: student } = await supabase
    .from('students')
    .select('id, nama, no_absen, nickname')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  // Absen hari ini (WITA) — dibaca di client juga, ini utk initial state.
  let todayAttendance = null
  if (student) {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', student.id)
      .order('tanggal', { ascending: false })
      .limit(1)
    todayAttendance = data?.[0] ?? null
  }

  return (
    <StudentDashboard
      email={user.email}
      student={student}
      initialAttendance={todayAttendance}
    />
  )
}
