'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      themes={['biru', 'hijau', 'dark']}
      value={{ biru: 'theme-biru', hijau: 'theme-hijau', dark: 'dark' }}
      defaultTheme="biru"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
