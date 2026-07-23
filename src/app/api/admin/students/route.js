import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/*
  Provisioning akun login SISWA (service-role, server-side).

  Otorisasi: hanya role developer / sekretaris.

  Aksi:
    - provision   : buat akun Auth utk siswa yang belum punya (bulk / semua).
                    Email digenerate: <slug-nama>@kelas.com, default password.
                    Simpan kredensial ke student_credentials utk dibagikan.
    - list_creds  : ambil daftar kredensial default (email + password) utk export.
    - reset_password : reset password 1 siswa ke password baru (default).

  Format email: nama dijadikan slug + suffix no_absen agar unik.
  Domain default: 'kelas.com' (bisa dikirim via body.domain).
*/

const DEFAULT_DOMAIN = 'kelas.com'
const DEFAULT_PASSWORD = 'saintek2'

function slugify(nama) {
  return String(nama)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // buang aksen
    .replace(/[^a-z0-9]+/g, '.')                       // non-alfanumerik → titik
    .replace(/^\.+|\.+$/g, '')                          // trim titik
    .slice(0, 40) || 'siswa'
}

async function requireProvisioner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }
  const { data: me } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!me || !['developer', 'sekretaris'].includes(me.role)) {
    return { error: 'Hanya developer / sekretaris.', status: 403 }
  }
  return { user }
}

export async function POST(request) {
  const guard = await requireProvisioner()
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await request.json()
  const admin = createAdminClient()
  const domain = (body.domain || DEFAULT_DOMAIN).replace(/^@/, '')
  const password = body.password || DEFAULT_PASSWORD

  try {
    if (body.action === 'list_creds') {
      const { data: creds } = await admin
        .from('student_credentials')
        .select('*, students(nama, no_absen)')
        .order('created_at')
      const rows = (creds ?? []).map((c) => ({
        student_id: c.student_id,
        no_absen: c.students?.no_absen ?? '',
        nama: c.students?.nama ?? '',
        email: c.email,
        password: c.default_password,
      })).sort((a, b) => (a.no_absen || 0) - (b.no_absen || 0))
      return NextResponse.json({ ok: true, creds: rows })
    }

    if (body.action === 'provision') {
      // Siswa yang belum punya akun login.
      const { data: students } = await admin
        .from('students')
        .select('id, nama, no_absen, auth_user_id')
        .order('no_absen')
      const pending = (students ?? []).filter((s) => !s.auth_user_id)

      let created = 0
      const errors = []
      for (const s of pending) {
        const email = `${slugify(s.nama)}.${s.no_absen}@${domain}`
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: s.nama, is_student: true },
        })
        if (error) {
          errors.push(`${s.nama}: ${error.message}`)
          continue
        }
        // Tautkan akun ke siswa + set nickname default = nama lengkap.
        await admin.from('students')
          .update({ auth_user_id: data.user.id, nickname: s.nama })
          .eq('id', s.id)
        // Simpan kredensial default utk dibagikan.
        await admin.from('student_credentials').upsert({
          student_id: s.id, email, default_password: password,
        })
        created++
      }
      return NextResponse.json({ ok: true, created, skipped: (students?.length ?? 0) - pending.length, errors })
    }

    if (body.action === 'reset_password') {
      const { studentId } = body
      const { data: cred } = await admin
        .from('student_credentials').select('*').eq('student_id', studentId).maybeSingle()
      const { data: st } = await admin
        .from('students').select('auth_user_id').eq('id', studentId).maybeSingle()
      if (!st?.auth_user_id) return NextResponse.json({ error: 'Siswa belum punya akun.' }, { status: 400 })
      const { error } = await admin.auth.admin.updateUserById(st.auth_user_id, { password })
      if (error) throw error
      if (cred) await admin.from('student_credentials').update({ default_password: password }).eq('student_id', studentId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
