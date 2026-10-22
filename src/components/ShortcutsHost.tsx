'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { puedeVerRuta, puede, useRol } from '@/lib/roles';
import { openOtrForm } from '@/lib/ui';
import classes from './ShortcutsHost.module.css';

const IR: Record<string, [string, string]> = {
  i: ['/inicio', 'Inicio'], s: ['/seguimiento', 'Seguimiento'], k: ['/kanban', 'Tablero'], c: ['/gantt', 'Cronograma (Gantt)'],
  p: ['/capacidad', 'Capacidad'], m: ['/maquinas', 'Máquinas'], e: ['/evidencia', 'Evidencia'], q: ['/calidad', 'No conformidades'],
  z: ['/cotizador', 'Cotizador'], u: ['/clientes', 'Clientes'], v: ['/inventario', 'Inventario'], o: ['/compras', 'Compras'],
  l: ['/calculadora', 'Calculadora'], x: ['/configuracion', 'Configuración'], t: ['/tareas', 'Tareas'], r: ['/reportes', 'Reportes'],
};

/** Atajos de teclado globales: `?` ayuda · `n` nueva OTR · `g` + letra para ir a una pantalla. */
export function ShortcutsHost() {
  const router = useRouter();
  const rol = useRol();
  const [open, setOpen] = useState(false);
  const esperaG = useRef<ReturnType<typeof setTimeout> | null>(null);
  const g = useRef(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (g.current) {
        g.current = false; if (esperaG.current) clearTimeout(esperaG.current);
        const dest = IR[e.key.toLowerCase()];
        if (!dest) return;
        e.preventDefault();
        if (!puedeVerRuta(rol, dest[0])) return notifications.show({ message: `${dest[1]} no está disponible para tu rol.`, color: 'orange' });
        router.push(dest[0]);
        return;
      }
      if (e.key === '?') { e.preventDefault(); setOpen(true); }
      else if (e.key.toLowerCase() === 'g') { g.current = true; esperaG.current = setTimeout(() => { g.current = false; }, 1200); }
      else if (e.key.toLowerCase() === 'n' && puede(rol, 'otr.create')) { e.preventDefault(); openOtrForm(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [router, rol]);

  return (
    <Modal opened={open} onClose={() => setOpen(false)} size={620} padding="lg" title={<b>Atajos de teclado</b>}>
      <div className={classes.cols}>
        <section>
          <h3>General</h3>
          <dl>
            <div><dt><kbd>Ctrl</kbd> <kbd>K</kbd></dt><dd>Buscar OTR, materiales y clientes</dd></div>
            <div><dt><kbd>n</kbd></dt><dd>Nueva OTR</dd></div>
            <div><dt><kbd>?</kbd></dt><dd>Esta ayuda</dd></div>
            <div><dt><kbd>Esc</kbd></dt><dd>Cerrar paneles y ventanas</dd></div>
          </dl>
          <h3>Listas</h3>
          <dl>
            <div><dt><kbd>↑</kbd> <kbd>↓</kbd></dt><dd>Moverse entre órdenes en Seguimiento</dd></div>
            <div><dt><kbd>Shift</kbd> <kbd>←</kbd> <kbd>→</kbd></dt><dd>Mover una ficha de etapa en el Tablero</dd></div>
          </dl>
        </section>
        <section>
          <h3>Ir a… <small>(<kbd>g</kbd> y luego)</small></h3>
          <dl>
            {Object.entries(IR).map(([k, [, n]]) => (<div key={k}><dt><kbd>g</kbd> <kbd>{k}</kbd></dt><dd>{n}</dd></div>))}
          </dl>
        </section>
      </div>
    </Modal>
  );
}
