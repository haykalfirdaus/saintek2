import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from './admin-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Akun tanpa baris profiles BUKAN admin (mis. akun siswa). Jangan default ke
  // 'ketua' — tolak & arahkan ke halaman utama siswa.
  if (!profile) redirect('/')

  return <AdminDashboard role={profile.role} name={profile.full_name || user.email} />
}
