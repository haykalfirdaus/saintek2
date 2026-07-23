import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/*
  Account management via service-role key (server-side).

  Self-service (semua role, hanya untuk akun sendiri):
    - update_self : ganti email dan/atau password akun sendiri TANPA verifikasi email

  Developer-only (kelola admin lain):
    - create       : buat user admin baru (email confirm otomatis)
    - set_password : ganti password admin lain TANPA verifikasi email
    - set_email    : ganti email admin lain TANPA verifikasi email
    - set_role     : ubah role admin
    - delete       : hapus akun admin
  Otorisasi: verifikasi caller via RLS-backed profiles read.
*/
export async function POST(request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  try {
    // --- Self-service: berlaku untuk semua role, hanya akun sendiri ---
    if (body.action === 'update_self') {
      const { email, password } = body
      const patch = {}
      if (email) { patch.email = email; patch.email_confirm = true }
      if (password) {
        if (String(password).length < 6) {
          return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 })
        }
        patch.password = password
      }
      if (!patch.email && !patch.password) {
        return NextResponse.json({ error: 'Tidak ada perubahan.' }, { status: 400 })
      }
      const { error } = await admin.auth.admin.updateUserById(user.id, patch)
      if (error) throw error
      // Kalau yang ganti adalah SISWA & mengganti password, tandai kredensial
      // default sudah tidak berlaku (password asli tak bisa disimpan — di-hash).
      if (patch.password) {
        const { data: st } = await admin
          .from('students').select('id').eq('auth_user_id', user.id).maybeSingle()
        if (st?.id) {
          await admin.from('student_credentials')
            .update({ password_changed: true }).eq('student_id', st.id)
        }
      }
      return NextResponse.json({ ok: true })
    }

    // --- Aksi berikut khusus developer ---
    const { data: me } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (me?.role !== 'developer') {
      return NextResponse.json({ error: 'Hanya developer.' }, { status: 403 })
    }

    if (body.action === 'list') {
      // Gabungkan profiles dengan email dari auth.users.
      const { data: profiles } = await admin
        .from('profiles')
        .select('*')
        .order('created_at')
      const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const emailById = new Map((authList?.users ?? []).map((u) => [u.id, u.email]))
      const admins = (profiles ?? []).map((p) => ({ ...p, email: emailById.get(p.id) ?? '' }))
      return NextResponse.json({ ok: true, admins })
    }

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

    if (body.action === 'set_email') {
      const { userId, email } = body
      if (!email) return NextResponse.json({ error: 'Email wajib.' }, { status: 400 })
      const { error } = await admin.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
      })
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
