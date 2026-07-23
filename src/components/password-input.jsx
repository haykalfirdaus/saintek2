'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/*
  Input password dengan tombol show/hide.
  Props sama seperti <input> biasa (value, onChange, placeholder, dll).
*/
export function PasswordInput({ className = '', ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={`input-field pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-muted"
        aria-label={show ? 'Sembunyikan password' : 'Lihat password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
