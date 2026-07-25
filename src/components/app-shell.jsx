import { SideNav } from './side-nav'
import { BottomNav } from './bottom-nav'

/*
  Responsive page frame shared by every route.
  - Mobile: single column, fixed BottomNav (thumb zone), no rail.
  - Desktop (lg+): fixed left SideNav rail; content shifts right (.pl-rail) and
    the bottom nav disappears.
  Children supply their own header + <main> so each page keeps full control of
  its content; the shell only owns navigation chrome + width offset.
*/
export function AppShell({ children }) {
  return (
    <div className="app-mesh min-h-dvh">
      <SideNav />
      <div className="pl-rail">{children}</div>
      <BottomNav />
    </div>
  )
}
