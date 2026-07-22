import { createClient } from '@/lib/supabase/client'

// Upload one file to a bucket and return its public URL. Used by admin panels.
export async function uploadToBucket(bucket, file, folder = 'admin') {
  const supabase = createClient()
  const rand = Math.random().toString(36).slice(2)
  // Derive extension from MIME type — don't rely on file.name (mobile camera
  // uploads may have empty/invalid names → Supabase "Invalid path" errors).
  const ext = (file.type?.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const path = `${folder}/${rand}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
