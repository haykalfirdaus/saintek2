// Role definitions mirrored from the `profiles.role` DB enum.

export const ROLES = {
  DEVELOPER: 'developer',
  SEKRETARIS: 'sekretaris',
  BENDAHARA: 'bendahara',
  KETUA: 'ketua', // ketua / wakil ketua kelas
  WALI_KELAS: 'wali_kelas',
  GURU_MAPEL: 'guru_mapel',
  PENGATUR_KEBERSIHAN: 'pengatur_kebersihan', // khusus piket
}

export const ROLE_LABEL = {
  developer: 'Developer',
  sekretaris: 'Sekretaris',
  bendahara: 'Bendahara',
  ketua: 'Ketua / Wakil Ketua',
  wali_kelas: 'Wali Kelas',
  guru_mapel: 'Guru Mapel',
  pengatur_kebersihan: 'Pengatur Kebersihan',
}

/*
  Capabilities per role (client-side UX gate; RLS enforces server-side).
    upload       : fitur Upload Lanjutan (kamera/foto/dokumen/URL) → file.
    absensi      : panel rekap absensi (lihat harian/mingguan/bulanan + export).
    provisioning : buat akun login siswa massal + lihat kredensial default.
    readonly     : role hanya-baca (sembunyikan semua tombol aksi di UI).

  Aturan role baru:
    - wali_kelas          : READ-ONLY. Pantau absensi, pengumuman, tugas, kas.
    - guru_mapel          : hanya fitur Tugas (lihat/tambah). Tanpa upload file.
    - pengatur_kebersihan : hanya Piket.
*/
export const ROLE_CAPS = {
  developer: {
    siswa: true, piket: true, mapel: true, libur: true,
    tugas: true, kas: true, pengumuman: true, popup: true, akun: true, galeri: true, akun_saya: true,
    upload: true, absensi: true, provisioning: true, readonly: false,
  },
  sekretaris: {
    siswa: true, piket: true, mapel: true, libur: true,
    tugas: true, kas: false, pengumuman: false, popup: false, akun: false, galeri: true, akun_saya: true,
    upload: true, absensi: true, provisioning: true, readonly: false,
  },
  bendahara: {
    siswa: false, piket: false, mapel: false, libur: false,
    tugas: false, kas: true, pengumuman: true, popup: false, akun: false, galeri: false, akun_saya: true,
    upload: false, absensi: false, provisioning: false, readonly: false,
  },
  ketua: {
    siswa: true, piket: true, mapel: true, libur: true,
    tugas: true, kas: false, pengumuman: true, popup: false, akun: false, galeri: true, akun_saya: true,
    upload: true, absensi: true, provisioning: false, readonly: false,
  },
  // Read-only: bisa membuka panel absensi/pengumuman/tugas/kas tapi tanpa aksi tulis.
  wali_kelas: {
    siswa: false, piket: false, mapel: false, libur: false,
    tugas: true, kas: true, pengumuman: true, popup: false, akun: false, galeri: false, akun_saya: true,
    upload: false, absensi: true, provisioning: false, readonly: true,
  },
  // Hanya Tugas.
  guru_mapel: {
    siswa: false, piket: false, mapel: false, libur: false,
    tugas: true, kas: false, pengumuman: false, popup: false, akun: false, galeri: false, akun_saya: true,
    upload: false, absensi: false, provisioning: false, readonly: false,
  },
  // Hanya Piket.
  pengatur_kebersihan: {
    siswa: false, piket: true, mapel: false, libur: false,
    tugas: false, kas: false, pengumuman: false, popup: false, akun: false, galeri: false, akun_saya: true,
    upload: false, absensi: false, provisioning: false, readonly: false,
  },
}

// Role yang boleh upload file — dipakai UI gate & dicerminkan di RLS Storage.
export const UPLOAD_ROLES = ['developer', 'sekretaris', 'ketua']

// Urutan role yang bisa di-preview developer lewat "Lihat sebagai".
export const PREVIEW_ROLES = [
  'guru_mapel', 'wali_kelas', 'ketua', 'sekretaris', 'bendahara', 'pengatur_kebersihan',
]

export function can(role, cap) {
  return !!ROLE_CAPS[role]?.[cap]
}

export function canUpload(role) {
  return UPLOAD_ROLES.includes(role)
}

// Role hanya-baca → sembunyikan tombol aksi tulis di UI.
export function isReadOnly(role) {
  return !!ROLE_CAPS[role]?.readonly
}
