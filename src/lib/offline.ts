import { useEffect, useState, useSyncExternalStore } from 'react';

/** Cola de cambios hechos sin conexión. En producción se envían a la API al volver la señal. */
export interface Pendiente { id: string; texto: string; ts: number }
const KEY = 'sgo-cola-v1';
let cola: Pendiente[] = [];
let forzado = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());
const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(cola)); } catch { /* sin storage */ } };

export const cargarCola = () => { try { const r = localStorage.getItem(KEY); if (r) { cola = JSON.parse(r) as Pendiente[]; emit(); } } catch { /* sin storage */ } };
export const encolar = (texto: string) => { cola = [...cola, { id: `${Date.now()}`, texto, ts: Date.now() }]; guardar(); emit(); };
export const vaciarCola = () => { const n = cola.length; cola = []; guardar(); emit(); return n; };
export const setSinConexionSimulada = (v: boolean) => { forzado = v; emit(); };

export const useCola = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => cola, () => [] as Pendiente[]);
const useForzado = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => forzado, () => false);

/** true si el navegador está en línea y no se simula corte */
export function useOnline() {
  const [real, setReal] = useState(true);
  const sim = useForzado();
  useEffect(() => {
    setReal(navigator.onLine);
    const on = () => setReal(true); const off = () => setReal(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return real && !sim;
}
