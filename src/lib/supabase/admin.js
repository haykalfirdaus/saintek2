import { createClient } from '@supabase/supabase-js'

/*
  Service-role client. NEVER import this into client components.
  Used only inside server-side route handlers that require admin privileges,
  e.g. the Developer panel changing other admins' passwords.
  Requires SUPABASE_SERVICE_ROLE_KEY (server-only env var).
*/
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
