/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ---- Total byte weight & unused JS ----
  // gzip/br kompresi respons (HTML/JS/CSS) di server Next.
  compress: true,
  // Buang header "x-powered-by" (byte kecil + tidak bocorkan versi).
  poweredByHeader: false,
  // Jangan kirim source map besar ke browser production.
  productionBrowserSourceMaps: false,

  experimental: {
    /*
      UNUSED JAVASCRIPT (ref: lighthouse/performance/unused-javascript)
      lucide-react & date/util libs punya ratusan named export. Tanpa ini,
      barrel-import bisa menyeret ikon yang tidak dipakai ke bundle.
      optimizePackageImports mengubahnya jadi import per-modul → tree-shaking
      maksimal, JS terpakai ↑, byte weight ↓.
    */
    optimizePackageImports: ['lucide-react'],
  },

  // ---- IMAGE DELIVERY (ref: performance/insights/image-delivery) ----
  images: {
    // Negosiasi format modern: AVIF dulu (paling kecil), fallback WebP.
    formats: ['image/avif', 'image/webp'],
    // Cache hasil optimasi image minimal 30 hari (ref: insights/cache).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Ukuran responsif — hindari mengirim gambar lebih besar dari yang tampil.
    deviceSizes: [360, 420, 640, 768, 1024, 1280],
    imageSizes: [64, 128, 256, 384],
    // Serve foto langsung dari Supabase Storage.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      // Baseline web-security headers untuk semua route.
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            // Izinkan geolocation (fitur absen) & kamera dari origin sendiri.
            key: 'Permissions-Policy',
            value: 'geolocation=(self), microphone=(), camera=(self)',
          },
        ],
      },
      /*
        EFFICIENT CACHE LIFETIMES (ref: performance/insights/cache)
        Next sudah men-set 1-tahun-immutable untuk /_next/static secara otomatis,
        jadi tidak perlu di-override (override malah memicu warning + bisa ganggu
        dev). Kita hanya eksplisitkan aset publik yang TIDAK ber-hash (ikon,
        manifest, favicon) agar Lighthouse tak menandai "inefficient cache policy".
      */
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // favicon + manifest jarang berubah → 30 hari, boleh revalidate.
        source: '/:file(favicon.svg|manifest.webmanifest)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000' },
        ],
      },
    ]
  },
}

export default nextConfig
