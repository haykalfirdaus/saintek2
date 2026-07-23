import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountClient } from './account-client'

export const dynamic = 'force-dynamic'

export default async function AkunPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Akun admin/pengurus → arahkan ke panel admin.
  const { data: adminProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()

  // Data siswa yang tertaut ke akun ini.
  const { data: student } = await supabase
    .from('students')
    .select('id, nama, no_absen, nickname')
    .eq('auth_user_id', user.id)
    .maybeSingle()

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
    <AccountClient
      email={user.email}
      student={student}
      isAdmin={!!adminProfile}
      adminRole={adminProfile?.role ?? null}
      initialAttendance={todayAttendance}
    />
  )
}
