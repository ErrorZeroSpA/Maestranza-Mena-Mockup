'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Modal } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { Rol, useRol, useRolDef } from '@/lib/roles';
import { abrirGuia, cerrarGuia, useGuia } from '@/lib/ui';
import classes from './RoleWelcome.module.css';

const GUIA_GENERICA = [
  { href: '/inicio', t: 'Inicio', d: 'Un resumen de la planta y lo que requiere atención.' },
  { href: '/seguimiento', t: 'Seguimiento', d: 'Las órdenes de trabajo y su avance.' },
  { href: '/tareas', t: 'Tareas', d: 'Lo que tienes pendiente con el equipo.' },
];
const GUIA: Record<string, { href: string; t: string; d: string }[]> = {
  gerencia: [
    { href: '/inicio', t: 'Inicio', d: 'KPIs, alertas y la ruta de planta de un vistazo.' },
    { href: '/capacidad', t: 'Capacidad', d: 'Detecta semanas sobrecargadas antes de comprometer fechas.' },
    { href: '/reportes', t: 'Reportes', d: 'Márgenes, plazos y horas, listos para exportar.' },
  ],
  comercial: [
    { href: '/cotizador', t: 'Cotizador', d: 'Cotiza con materiales, horas y margen; al aprobarse pasa a OTR.' },
    { href: '/seguimiento', t: 'Seguimiento', d: 'Comparte con el cliente un enlace de estado con avance y fotos.' },
    { href: '/clientes', t: 'Clientes', d: 'Contactos y cartera de órdenes por cliente.' },
  ],
  produccion: [
    { href: '/kanban', t: 'Tablero', d: 'Mueve las órdenes por la ruta, con mouse o con Shift + flechas.' },
    { href: '/maquinas', t: 'Máquinas', d: 'Registra paradas y mira el Pareto de causas.' },
    { href: '/capacidad', t: 'Capacidad', d: 'Revisa si tu área aguanta la carga de las próximas semanas.' },
  ],
  bodega: [
    { href: '/inventario', t: 'Inventario', d: 'Stock, material comprometido por cubicaciones y despachos.' },
    { href: '/compras', t: 'Compras', d: 'Reposición sugerida, órdenes de compra y recepción.' },
    { href: '/calculadora', t: 'Calculadora', d: 'Convierte medidas en kilos y costo de acero.' },
  ],
  calidad: [
    { href: '/calidad', t: 'No conformidades', d: 'Registra, analiza y cierra con acción correctiva.' },
    { href: '/seguimiento', t: 'Seguimiento → Calidad', d: 'En cada OTR: certificados, firmas y el dossier ISO 9001.' },
    { href: '/evidencia', t: 'Evidencia', d: 'Fotos con marcas que respaldan cada etapa.' },
  ],
};

/** Guía corta al entrar con un rol por primera vez. */
export function RoleWelcome() {
  const rol: Rol = useRol();
  const def = useRolDef();
  const abierta = useGuia();
  useEffect(() => {
    try {
      const k = `sgo-guia-${rol}`;
      if (!localStorage.getItem(k)) { localStorage.setItem(k, '1'); abrirGuia(); }
    } catch { /* sin storage */ }
  }, [rol]);

  return (
    <Modal opened={abierta} onClose={cerrarGuia} size={560} padding="lg" title={<b>Tu espacio: {def.nombre}</b>}>
      <p className={classes.foco}>{def.foco}</p>
      <ol className={classes.list}>
        {(GUIA[rol] ?? GUIA_GENERICA).map((g, i) => (
          <li key={g.href}>
            <b className="num">{i + 1}</b>
            <span><strong>{g.t}</strong>{g.d}</span>
            <Link href={g.href} onClick={cerrarGuia} aria-label={`Ir a ${g.t}`}><IconArrowRight size={16} /></Link>
          </li>
        ))}
      </ol>
      <p className={classes.hint}>Atajos: <kbd>Ctrl</kbd> <kbd>K</kbd> busca todo · <kbd>?</kbd> muestra todos los atajos. Cambia de rol arriba a la derecha para ver otros puntos de vista.</p>
      <Button color="forja" onClick={cerrarGuia} fullWidth>Entendido</Button>
    </Modal>
  );
}
