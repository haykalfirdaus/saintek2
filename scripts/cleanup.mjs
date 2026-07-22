#!/usr/bin/env node
/*
  CLEANUP SEBELUM DEPLOY
  Menghapus artefak build & boilerplate yang tidak perlu ikut ke GitHub,
  TANPA menyentuh source code, config, skill/tools, atau folder .claude.

  Jalankan:  node scripts/cleanup.mjs
*/
import { rm, stat } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = process.cwd()

// Hanya artefak yang aman dihapus. .env.local sengaja TIDAK dihapus otomatis
// (biarkan dev memutuskan), tapi sudah di-ignore git.
const TARGETS = [
  '.next',
  'out',
  'build',
  'node_modules/.cache',
  '.turbo',
  '.vercel',
  // boilerplate bawaan yang kadang ikut saat create-next-app:
  'public/next.svg',
  'public/vercel.svg',
  'public/file.svg',
  'public/globe.svg',
  'public/window.svg',
  'src/app/page.module.css',
]

// JANGAN pernah sentuh ini.
const PROTECTED = ['.claude', 'src', 'supabase', 'package.json', 'tailwind.config.js']

async function exists(p) {
  try { await stat(p); return true } catch { return false }
}

let removed = 0
for (const t of TARGETS) {
  if (PROTECTED.includes(t.split('/')[0]) && !t.includes('/')) continue
  const p = join(ROOT, t)
  if (await exists(p)) {
    await rm(p, { recursive: true, force: true })
    console.log('  ✓ dihapus:', t)
    removed++
  }
}
console.log(removed ? `\nCleanup selesai — ${removed} item dihapus.` : 'Sudah bersih, tidak ada yang dihapus.')
