'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconBell, IconBuildingFactory2, IconHistory, IconSettings, IconShieldLock, IconUsers } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { General } from './General';
import { Usuarios } from './Usuarios';
import { Roles } from './Roles';
import { Planta } from './Planta';
import { Notificaciones } from './Notificaciones';
import { Auditoria } from './Auditoria';
import classes from './configuracion.module.css';

const SECCIONES = [
  { id: 'general', label: 'General', desc: 'Empresa, parámetros y seguridad', icon: IconSettings },
  { id: 'usuarios', label: 'Usuarios', desc: 'Invitaciones, estados y roles', icon: IconUsers },
  { id: 'roles', label: 'Roles y permisos', desc: 'Qué ve y qué puede hacer cada rol', icon: IconShieldLock },
  { id: 'planta', label: 'Planta', desc: 'Capacidad, alertas y plazos', icon: IconBuildingFactory2 },
  { id: 'notificaciones', label: 'Notificaciones', desc: 'Qué avisar y por dónde', icon: IconBell },
  { id: 'auditoria', label: 'Auditoría', desc: 'Registro de cambios y accesos', icon: IconHistory },
] as const;

export default function ConfiguracionPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const sec = SECCIONES.find((s) => s.id === params.get('s'))?.id ?? 'general';
  return (
    <>
      <PageHead title="Configuración" sub="Administración del sistema · solo roles con permiso de administración" />
      <div className={classes.layout}>
        <nav className={classes.menu} aria-label="Secciones de configuración">
          {SECCIONES.map((s) => (
            <button key={s.id} data-on={s.id === sec || undefined} onClick={() => router.replace(`/configuracion?s=${s.id}`)}>
              <s.icon size={18} stroke={1.6} />
              <span><b>{s.label}</b><small>{s.desc}</small></span>
            </button>
          ))}
        </nav>
        <section className={classes.panel}>
          {sec === 'general' && <General />}
          {sec === 'usuarios' && <Usuarios />}
          {sec === 'roles' && <Roles />}
          {sec === 'planta' && <Planta />}
          {sec === 'notificaciones' && <Notificaciones />}
          {sec === 'auditoria' && <Auditoria />}
        </section>
      </div>
    </>
  );
}
