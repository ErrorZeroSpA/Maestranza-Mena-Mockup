import { useEffect, useState } from 'react';

/** Simula la primera carga (en producción vendría de la API). Evita saltos bruscos al entrar. */
export function useReady(ms = 450) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setReady(true); return; }
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ready;
}
