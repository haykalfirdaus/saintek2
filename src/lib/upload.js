import { createClient } from '@/lib/supabase/client'

// Ekstensi yang bisa dipercaya dari nama file dokumen (fallback ke MIME).
const DOC_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar']

// Ambil ekstensi paling andal: pakai nama file kalau valid, jika tidak pakai MIME.
function resolveExt(file) {
  const fromName = (file.name?.split('.').pop() || '').toLowerCase()
  if (fromName && (DOC_EXT.includes(fromName) || fromName.length <= 4)) return fromName
  // MIME → ext (mobile camera sering punya nama kosong).
  const mime = (file.type || '').toLowerCase()
  if (mime.startsWith('image/')) return mime.split('/')[1].replace('jpeg', 'jpg')
  const map = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'text/csv': 'csv',
  }
  return map[mime] || 'bin'
}

// Upload one file to a bucket and return its public URL. Used by admin panels.
export async function uploadToBucket(bucket, file, folder = 'admin') {
  const supabase = createClient()
  // Random 12-char id tanpa Date.now (aman di semua konteks).
  const rand = Math.random().toString(36).slice(2, 14)
  const ext = resolveExt(file)
  const path = `${folder}/${rand}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    // Cache aset user-upload 30 hari (ref: perf/insights/cache).
    cacheControl: '2592000',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/*
  Upload lengkap dengan metadata — dipakai form Upload Lanjutan.
  Mengembalikan { url, name, type, size, is_image }.
*/
export async function uploadWithMeta(bucket, file, folder = 'admin') {
  const url = await uploadToBucket(bucket, file, folder)
  return {
    url,
    name: file.name || 'file',
    type: file.type || '',
    size: file.size || 0,
    is_image: (file.type || '').startsWith('image/'),
  }
}
