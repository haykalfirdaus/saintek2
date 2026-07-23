'use client'

import { useEffect } from 'react'

/*
  Pesan sapaan di Console (Inspect) dari pembuat website.
  Dirender sekali di sisi klien; tidak menampilkan data sensitif apa pun.
*/
export function ConsoleSignature() {
  useEffect(() => {
    try {
      console.log(
        '%cXI Saintek 2%c  •  dibuat oleh Muhammad Haykal Firdaus',
        'background:#3b82f6;color:#fff;padding:2px 8px;border-radius:6px;font-weight:bold',
        'color:#64748b',
      )
      console.log(
        '%cHaloo teman teman! 👋\n%cSaya Muhammad Haykal Firdaus selaku pembuat website ini.\n' +
        'Kalau ada celah keamanan, boleh hubungi saya di XI Saintek 2 yaa 🙌',
        'font-size:15px;font-weight:bold;color:#3b82f6',
        'font-size:13px;color:inherit',
      )
    } catch {
      // abaikan bila console tidak tersedia
    }
  }, [])

  return null
}
