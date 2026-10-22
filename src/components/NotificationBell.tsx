'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionIcon, Indicator, Popover } from '@mantine/core';
import { IconBell, IconBoxSeam, IconCamera, IconChecklist, IconClipboardText, IconShieldCheck, IconUsers } from '@tabler/icons-react';
import { logStore, relFecha, useConfig } from '@/lib/data';
import { markAllSeen, useSeen } from '@/lib/ui';
import type { Evento } from '@/lib/mock';
import classes from './NotificationBell.module.css';

const ICON: Record<Evento['tipo'], React.ElementType> = { otr: IconClipboardText, stock: IconBoxSeam, calidad: IconShieldCheck, cliente: IconUsers, tarea: IconChecklist, evidencia: IconCamera };
const RUTA: Record<Evento['tipo'], string> = { otr: '/seguimiento', stock: '/inventario', calidad: '/calidad', cliente: '/clientes', tarea: '/tareas', evidencia: '/evidencia' };

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [solo, setSolo] = useState(false);
  const seen = useSeen();
  const conf = useConfig();
  const log = logStore.use().filter((e) => conf.notif[e.tipo]?.app !== false).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const unread = log.filter((e) => e.fecha > seen);
  const lista = (solo ? unread : log).slice(0, 12);

  const ir = (e: Evento) => { setOpen(false); router.push(e.otrId ? `/seguimiento?otr=${e.otrId}` : RUTA[e.tipo]); };

  return (
    <Popover opened={open} onChange={setOpen} position="bottom-end" width={380} shadow="md" withArrow={false} transitionProps={{ transition: 'pop-top-right', duration: 140 }}>
      <Popover.Target>
        <Indicator label={unread.length > 9 ? '9+' : unread.length} disabled={unread.length === 0} size={16} color="forja" offset={4} processing={false}>
          <ActionIcon variant="default" size={34} aria-label={`Notificaciones${unread.length ? `, ${unread.length} sin leer` : ''}`} onClick={() => setOpen((o) => !o)}>
            <IconBell size={17} stroke={1.7} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <div className={classes.head}>
          <b>Notificaciones</b>
          <div>
            <button data-on={!solo || undefined} onClick={() => setSolo(false)}>Todas</button>
            <button data-on={solo || undefined} onClick={() => setSolo(true)}>Sin leer {unread.length > 0 && <em>{unread.length}</em>}</button>
          </div>
        </div>
        <ul className={classes.list}>
          {lista.map((e) => {
            const I = ICON[e.tipo];
            return (
              <li key={e.id}>
                <button onClick={() => ir(e)} data-unread={e.fecha > seen || undefined}>
                  <span className={classes.ico}><I size={16} stroke={1.7} /></span>
                  <span className={classes.txt}><b>{e.texto}</b><small>{relFecha(e.fecha)} · {e.autor}</small></span>
                </button>
              </li>
            );
          })}
          {lista.length === 0 && <li className={classes.empty}>{solo ? 'Estás al día.' : 'Sin notificaciones.'}</li>}
        </ul>
        <div className={classes.foot}>
          <button disabled={unread.length === 0} onClick={() => markAllSeen(log[0]?.fecha ?? seen)}>Marcar todo como leído</button>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}
