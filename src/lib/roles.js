// Role definitions mirrored from the `profiles.role` DB enum.

export const ROLES = {
  DEVELOPER: 'developer',
  SEKRETARIS: 'sekretaris',
  BENDAHARA: 'bendahara',
  KETUA: 'ketua', // ketua / wakil ketua kelas
}

export const ROLE_LABEL = {
  developer: 'Developer',
  sekretaris: 'Sekretaris',
  bendahara: 'Bendahara',
  ketua: 'Ketua / Wakil Ketua',
}

// What each role may access in the admin panel (client-side UX gate; RLS enforces server-side).
export const ROLE_CAPS = {
  developer: {
    siswa: true, piket: true, mapel: true, libur: true,
    tugas: true, kas: true, pengumuman: true, popup: true, akun: true, galeri: true,
  },
  sekretaris: {
    siswa: true, piket: true, mapel: true, libur: true,
    tugas: true, kas: false, pengumuman: false, popup: false, akun: false, galeri: false,
  },
  bendahara: {
    siswa: false, piket: false, mapel: false, libur: false,
    tugas: false, kas: true, pengumuman: true, popup: false, akun: false, galeri: false,
  },
  ketua: {
    siswa: true, piket: true, mapel: true, libur: true,
    tugas: false, kas: false, pengumuman: true, popup: false, akun: false, galeri: false,
  },
}

export function can(role, cap) {
  return !!ROLE_CAPS[role]?.[cap]
}
