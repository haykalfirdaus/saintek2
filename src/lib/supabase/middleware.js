import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Refreshes the Supabase auth session on every request and guards /admin routes.
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Halaman yang boleh diakses TANPA sesi (hanya dua halaman login).
  const isLoginPage = path === '/login' || path === '/admin/login'

  // SELURUH web wajib login (khusus siswa/pengurus). Kalau belum login &
  // bukan halaman login → arahkan ke /login. Area /admin punya login sendiri.
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = path.startsWith('/admin') ? '/admin/login' : '/login'
    return NextResponse.redirect(url)
  }

  // Area /admin: hanya akun admin (punya baris profiles). Akun siswa yang
  // login lalu buka /admin → tolak, arahkan ke halaman utama.
  if (user && path.startsWith('/admin') && path !== '/admin/login') {
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('id', user.id).maybeSingle()
    if (!profile) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Sudah login (admin) → jangan tampilkan halaman login admin lagi.
  if (user && path === '/admin/login') {
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('id', user.id).maybeSingle()
    // Hanya admin yg di-skip ke /admin; siswa yg iseng buka /admin/login
    // dibiarkan (nanti login page-nya sendiri menolak).
    if (profile) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }
  if (user && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
