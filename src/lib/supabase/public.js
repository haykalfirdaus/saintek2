import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/*
  Public read-only client (anon key, NO cookies). Karena tidak menyentuh
  cookie/auth, hasil query bisa di-cache oleh Next (ISR revalidate), sehingga
  navigasi antar halaman publik jadi instan — tidak menunggu fetch tiap klik.
  RLS tetap berlaku (anon hanya bisa baca data publik).
*/
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
