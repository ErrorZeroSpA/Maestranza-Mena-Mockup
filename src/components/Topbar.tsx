'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { spotlight } from '@mantine/spotlight';
import { openOtrForm } from '@/lib/ui';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { RoleMenu } from './RoleMenu';
import { usePerm } from '@/lib/roles';
import classes from './Topbar.module.css';

const TITLES: Record<string, [string, string]> = {
  '/inicio': ['Operación', 'Inicio'],
  '/seguimiento': ['Operación', 'Seguimiento'],
  '/evidencia': ['Calidad', 'Evidencia'],
  '/calidad': ['Calidad', 'No conformidades'],
  '/clientes': ['Recursos', 'Clientes'],
  '/reportes': ['Análisis', 'Reportes'],
  '/maquinas': ['Operación', 'Máquinas'],
  '/capacidad': ['Operación', 'Capacidad'],
  '/cotizador': ['Comercial', 'Cotizador'],
  '/compras': ['Abastecimiento', 'Compras'],
  '/configuracion': ['Administración', 'Configuración'],
  '/calculadora': ['Recursos', 'Calculadora de acero'],
  '/kanban': ['Operación', 'Tablero'],
  '/gantt': ['Operación', 'Cronograma (Gantt)'],
  '/inventario': ['Recursos', 'Inventario'],
  '/tareas': ['Recursos', 'Tareas'],
};

export function Topbar() {
  const path = usePathname();
  const can = usePerm();
  const [a, b] = TITLES[Object.keys(TITLES).find((k) => path.startsWith(k)) ?? '/seguimiento'];
  return (
    <div className={classes.bar}>
      <div className={classes.crumb}><span>{a}</span><i>/</i><b>{b}</b></div>
      <button className={classes.search} aria-label="Buscar" onClick={() => spotlight.open()}>
        <IconSearch size={15} stroke={1.8} />
        <span>Buscar OTR, cliente, material…</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className={classes.tools}><RoleMenu /><NotificationBell /><ThemeToggle /></div>
      <div className={classes.date}>
        <span className="cap">Hoy</span>
        <b className="num">21 oct 2026</b>
      </div>
      {can('otr.create') && <Button className={classes.newBtn} size="xs" color="forja" leftSection={<IconPlus size={14} />} onClick={() => openOtrForm()}>Nueva OTR</Button>}
    </div>
  );
}
