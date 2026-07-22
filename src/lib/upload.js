import { createClient } from '@/lib/supabase/client'

// Upload one file to a bucket and return its public URL. Used by admin panels.
export async function uploadToBucket(bucket, file, folder = 'admin') {
  const supabase = createClient()
  const rand = Math.random().toString(36).slice(2)
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${rand}-${safe}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
