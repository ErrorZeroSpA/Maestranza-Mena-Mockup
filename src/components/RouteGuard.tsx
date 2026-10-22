'use client';

import { usePathname } from 'next/navigation';
import { puedeVerRuta, useRol } from '@/lib/roles';
import { NoAccess } from './NoAccess';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const rol = useRol();
  return puedeVerRuta(rol, path) ? <>{children}</> : <NoAccess />;
}
