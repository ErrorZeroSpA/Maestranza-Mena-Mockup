'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Drawer } from '@mantine/core';
import { IconLayoutKanban, IconTimeline, IconListDetails, IconBoxSeam, IconChecklist, IconLogout, IconCamera, IconHome2, IconShieldCheck, IconBuilding, IconChartBar, IconCalculator, IconDots, IconTool, IconGauge, IconFileInvoice, IconShoppingCart, IconSettings, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { Logo } from './Logo';
import { ncStore, otrStore, tareaStore } from '@/lib/data';
import { puedeVerRuta, useRol } from '@/lib/roles';
import { loadRailPref, setRailCollapsed, useRailCollapsed } from '@/lib/ui';
import classes from './Sidebar.module.css';

interface Item { href: string; label: string; hint: string; icon: React.ElementType; count?: number; hideMobile?: boolean }
interface Group { label: string; items: Item[] }

const groups = (nOtr: number, nTareas: number, nNc: number): Group[] => [
  {
    label: 'Operación',
    items: [
      { href: '/inicio', label: 'Inicio', hint: 'Planta hoy', icon: IconHome2 },
      { href: '/seguimiento', label: 'Seguimiento', hint: 'Órdenes y avance', icon: IconListDetails, count: nOtr },
      { href: '/kanban', label: 'Tablero', hint: 'Área × etapa', icon: IconLayoutKanban, hideMobile: true },
      { href: '/gantt', label: 'Gantt', hint: 'Cronograma y planificación', icon: IconTimeline, hideMobile: true },
      { href: '/capacidad', label: 'Capacidad', hint: 'Carga vs horas disponibles', icon: IconGauge, hideMobile: true },
      { href: '/maquinas', label: 'Máquinas', hint: 'Estado y paradas', icon: IconTool, hideMobile: true },
    ],
  },
  {
    label: 'Calidad',
    items: [
      { href: '/evidencia', label: 'Evidencia', hint: 'Fotos e informes', icon: IconCamera },
      { href: '/calidad', label: 'No conformidades', hint: 'ISO 9001', icon: IconShieldCheck, count: nNc, hideMobile: true },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/cotizador', label: 'Cotizador', hint: 'De la cotización a la OTR', icon: IconFileInvoice, hideMobile: true },
      { href: '/clientes', label: 'Clientes', hint: 'Contactos y OTR', icon: IconBuilding, hideMobile: true },
    ],
  },
  {
    label: 'Abastecimiento',
    items: [
      { href: '/inventario', label: 'Inventario', hint: 'Stock y despacho', icon: IconBoxSeam },
      { href: '/compras', label: 'Compras', hint: 'Reposición y proveedores', icon: IconShoppingCart, hideMobile: true },
      { href: '/calculadora', label: 'Calculadora', hint: 'Peso y costo de acero', icon: IconCalculator, hideMobile: true },
    ],
  },
  {
    label: 'Equipo',
    items: [
      { href: '/tareas', label: 'Tareas', hint: 'Pendientes del equipo', icon: IconChecklist, count: nTareas },
      { href: '/reportes', label: 'Reportes', hint: 'Indicadores y exportación', icon: IconChartBar, hideMobile: true },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/configuracion', label: 'Configuración', hint: 'Usuarios, roles y parámetros', icon: IconSettings, hideMobile: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const collapsed = useRailCollapsed();
  useEffect(() => { loadRailPref(); }, []);
  useEffect(() => { document.documentElement.dataset.rail = collapsed ? 'collapsed' : 'open'; }, [collapsed]);
  const rol = useRol();
  const GROUPS = groups(otrStore.use().length, tareaStore.use().filter((t) => t.estado !== 'Hecha').length, ncStore.use().filter((n) => n.estado !== 'Cerrada').length)
    .map((g) => ({ ...g, items: g.items.filter((it) => puedeVerRuta(rol, it.href)) }))
    .filter((g) => g.items.length > 0);
  return (
    <aside className={classes.rail} data-collapsed={collapsed || undefined}>
      <Link href="/inicio" className={classes.brand} aria-label="SGO — inicio">
        <Logo size={32} />
        <span><b>SGO</b><small>Maestranza Mena</small></span>
      </Link>
      <button className={classes.collapse} onClick={() => setRailCollapsed(!collapsed)} aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'} aria-pressed={collapsed} title={collapsed ? 'Expandir menú' : 'Colapsar menú'}>
        {collapsed ? <IconLayoutSidebarLeftExpand size={17} stroke={1.6} /> : <IconLayoutSidebarLeftCollapse size={17} stroke={1.6} />}
      </button>

      <nav className={classes.nav} aria-label="Principal">
        {GROUPS.map((g) => (
          <div key={g.label} className={classes.group}>
            <span className={classes.groupLabel}>{g.label}</span>
            {g.items.map((it) => (
              <Link key={it.href} href={it.href} title={it.label} className={classes.item} data-active={pathname.startsWith(it.href) || undefined} data-hide={it.hideMobile || undefined}>
                <it.icon size={18} stroke={1.6} />
                <span className={classes.text}>
                  <b>{it.label}</b>
                  <small>{it.hint}</small>
                </span>
                {it.count !== undefined && <em className="num">{it.count}</em>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <button className={classes.moreBtn} onClick={() => setMore(true)} aria-label="Más módulos"><IconDots size={18} stroke={1.6} /><b>Más</b></button>
      <Drawer opened={more} onClose={() => setMore(false)} position="bottom" size={400} padding="md" title={<b>Todos los módulos</b>}>
        <div className={classes.sheet}>
          {GROUPS.flatMap((g) => g.items).map((it) => (
            <Link key={it.href} href={it.href} onClick={() => setMore(false)} data-active={pathname.startsWith(it.href) || undefined}>
              <it.icon size={22} stroke={1.5} /><span>{it.label}</span>
            </Link>
          ))}
        </div>
      </Drawer>

      <div className={classes.me}>
        <div className={classes.avatar}>FR</div>
        <div className={classes.meText}>
          <b>Felipe Romero</b>
          <small>Adquisiciones · Bodega</small>
        </div>
        <Link href="/login" aria-label="Cerrar sesión" className={classes.out}><IconLogout size={16} stroke={1.6} /></Link>
      </div>
    </aside>
  );
}
