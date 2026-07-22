import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div>
        <p className="text-6xl font-black text-primary">404</p>
        <p className="mt-2 text-lg font-semibold">Halaman tidak ditemukan</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">Kembali ke Beranda</Link>
      </div>
    </div>
  )
}
