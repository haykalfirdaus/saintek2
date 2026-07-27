// Normalizer lampiran terpadu — dipakai Tugas, Pengumuman, & Popup agar
// tampilannya konsisten. Selalu mengembalikan array item:
//   { url, name, type, size, is_image }
//
// Urutan prioritas (supaya data lama tetap tampil):
//   1. record.attachments (jsonb)  → format baru (UploadField).
//   2. Legacy tugas: photo_url (foto) + attachment_url/attachment_name (dokumen).
//   3. Legacy pengumuman/popup: media_urls[] → dianggap foto.
export function collectAttachments(record) {
  if (!record) return []

  if (Array.isArray(record.attachments) && record.attachments.length) {
    return record.attachments
  }

  const list = []

  // Legacy tugas.
  if (record.photo_url) {
    list.push({ url: record.photo_url, name: 'Foto', is_image: true })
  }
  if (record.attachment_url) {
    list.push({
      url: record.attachment_url,
      name: record.attachment_name || 'Lampiran',
      type: record.attachment_type || '',
      is_image: false,
    })
  }

  // Legacy pengumuman/popup — media_urls selalu berisi foto.
  if (list.length === 0 && Array.isArray(record.media_urls)) {
    for (const url of record.media_urls) {
      if (url) list.push({ url, name: 'Foto', is_image: true })
    }
  }

  return list
}
