import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/*
  Developer-only account management. Uses the service-role key server-side to:
    - create   : buat user admin baru (email confirm otomatis)
    - set_password : ganti password admin lain TANPA verifikasi email
    - set_role : ubah role admin
  Otorisasi: verifikasi caller adalah 'developer' via RLS-backed profiles read.
*/
export async function POST(request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (me?.role !== 'developer') {
    return NextResponse.json({ error: 'Hanya developer.' }, { status: 403 })
  }

  const body = await request.json()
  const admin = createAdminClient()

  try {
    if (body.action === 'create') {
      const { email, password, full_name, role } = body
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
      })
      if (error) throw error
      // Pastikan profil punya role yang benar (trigger juga menangani ini).
      await admin.from('profiles').upsert({ id: data.user.id, full_name, role })
      return NextResponse.json({ ok: true, id: data.user.id })
    }

    if (body.action === 'set_password') {
      const { userId, password } = body
      const { error } = await admin.auth.admin.updateUserById(userId, { password })
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (body.action === 'set_role') {
      const { userId, role } = body
      const { error } = await admin.from('profiles').update({ role }).eq('id', userId)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (body.action === 'delete') {
      const { userId } = body
      // cegah developer menghapus dirinya sendiri
      if (userId === user.id) {
        return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri.' }, { status: 400 })
      }
      // hapus user di Auth (profil ikut terhapus via ON DELETE CASCADE)
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
