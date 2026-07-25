import { ThemeToggle } from './theme-toggle'

/*
  Shared sticky header for inner pages (Tugas, Kas, Galeri...).
  Widens with the content on desktop and drops the theme toggle there, since
  the SideNav rail already carries one. `right` lets a page inject extra
  controls (e.g. the Akun logout button).
*/
export function PageHeader({ icon: Icon, title, right = null }) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="app-container flex items-center justify-between py-3">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          {Icon && <Icon className="h-5 w-5 text-primary" />} {title}
        </h1>
        <div className="flex items-center gap-2">
          {right}
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
