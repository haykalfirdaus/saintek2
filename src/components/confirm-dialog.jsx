'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

/*
  Konfirmasi global lewat hook: const confirm = useConfirm()
  const ok = await confirm({ title, message, danger })  // -> boolean
  Bungkus tree admin dengan <ConfirmProvider>.
*/
const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null) // { opts, resolve }

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => setState({ opts: opts || {}, resolve }))
  }, [])

  function close(result) {
    state?.resolve(result)
    setState(null)
  }

  const o = state?.opts || {}

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          role="dialog" aria-modal="true"
          onClick={() => close(false)}
        >
          <div className="card w-full max-w-sm p-5 shadow-elevated animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className={'mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full ' +
              (o.danger ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary')}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-center text-lg font-bold">{o.title || 'Konfirmasi'}</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {o.message || 'Yakin ingin melanjutkan?'}
            </p>
            <div className="mt-5 flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => close(false)}>
                {o.cancelText || 'Batal'}
              </button>
              <button
                className={'flex-1 inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 font-semibold text-white transition active:scale-[0.97] ' +
                  (o.danger ? 'bg-destructive hover:brightness-110' : 'bg-primary hover:brightness-110')}
                onClick={() => close(true)}
              >
                {o.confirmText || 'Ya, Lanjut'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  // fallback ke window.confirm kalau provider tidak ada
  return ctx || (async (opts) => window.confirm(opts?.message || 'Yakin?'))
}
