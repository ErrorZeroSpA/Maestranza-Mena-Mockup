'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { RUTA_CATALOG } from '@/lib/roles';
import { Loader } from './Loader';
import classes from './RouteLoader.module.css';

const PUBLICAS = /^\/(login|estado|avance)(\/|$)/;

/**
 * Cada carga de pantalla muestra una barra superior y un velo con la marca.
 * Arranca al hacer clic en un enlace interno (respuesta inmediata) y termina poco después de que cambia la ruta.
 */
export function RouteLoader() {
  const path = usePathname();
  const [on, setOn] = useState(true);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducido = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const parar = (ms: number) => { if (t.current) clearTimeout(t.current); t.current = setTimeout(() => setOn(false), ms); };

  // la ruta cambió (o primera carga): mostrar y cerrar
  useEffect(() => { setOn(true); parar(reducido() ? 120 : 650); return () => { if (t.current) clearTimeout(t.current); }; }, [path]);

  // el clic en un enlace interno enciende el loader antes de que la ruta cambie
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a');
      const href = a?.getAttribute('href');
      if (!a || !href || !href.startsWith('/') || a.target === '_blank' || a.hasAttribute('download')) return;
      if (href.split('?')[0].split('#')[0] === path) return;
      setOn(true); parar(4000);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const app = !PUBLICAS.test(path) && path !== '/';
  const etiqueta = RUTA_CATALOG.find((r) => path === r.path || path.startsWith(r.path + '/'))?.label;

  return (
    <>
      <div className={classes.top} data-on={on || undefined} aria-hidden />
      <div className={classes.veil} data-on={on || undefined} data-app={app || undefined} aria-hidden={!on}>
        {on && <Loader label={etiqueta ? `Cargando ${etiqueta}…` : 'Cargando…'} sub="Maestranza Mena · SGO" />}
      </div>
    </>
  );
}
