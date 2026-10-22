import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { OtrFormModal } from '@/components/OtrFormModal';
import { SpotlightHost } from '@/components/SpotlightHost';
import { RouteGuard } from '@/components/RouteGuard';
import { ShortcutsHost } from '@/components/ShortcutsHost';
import { RoleWelcome } from '@/components/RoleWelcome';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <Sidebar />
      <div style={{ paddingLeft: 'var(--mm-rail-w)', transition: 'padding-left 200ms cubic-bezier(0.23, 1, 0.32, 1)' }} className="shell">
        <Topbar />
        <main id="contenido" tabIndex={-1} className="main" style={{ padding: '28px 32px 64px', maxWidth: 1480, margin: '0 auto', width: '100%' }}><RouteGuard>{children}</RouteGuard></main>
      </div>
      <OtrFormModal />
      <SpotlightHost />
      <ShortcutsHost />
      <RoleWelcome />
      <style>{`@media (max-width: 62em){ .shell{ padding-left:0 !important; padding-bottom: calc(60px + env(safe-area-inset-bottom)) } .main{ padding: 18px 14px 40px !important } }`}</style>
    </>
  );
}
