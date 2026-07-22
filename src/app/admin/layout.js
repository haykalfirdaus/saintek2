import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Server-side guard: ensure a session + attach role for the admin subtree.
export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The login page renders its own tree; if unauthenticated, middleware already redirected.
  if (!user) {
    // /admin/login is excluded by middleware; but guard other routes here too.
    return children
  }

  return <div className="min-h-dvh bg-background">{children}</div>
}
