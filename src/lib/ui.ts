import { useSyncExternalStore } from 'react';
import type { Otr } from './mock';

/** Estado de UI global mínimo: qué formulario de OTR está abierto (lo dispara el botón de la barra superior). */
type Form = { mode: 'new' } | { mode: 'edit'; otr: Otr } | null;
let form: Form = null;
const subs = new Set<() => void>();
const set = (f: Form) => { form = f; subs.forEach((s) => s()); };

export const openOtrForm = (otr?: Otr) => set(otr ? { mode: 'edit', otr } : { mode: 'new' });
export const closeOtrForm = () => set(null);
export const useOtrForm = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => form, () => null);

/* ---- Notificaciones: marca de "visto hasta" (en memoria) ---- */
let seen = '2026-10-20T23:00:00';
const subsSeen = new Set<() => void>();
export const markAllSeen = (latest: string) => { seen = latest; subsSeen.forEach((s) => s()); };
export const useSeen = () => useSyncExternalStore((cb) => { subsSeen.add(cb); return () => { subsSeen.delete(cb); }; }, () => seen, () => seen);

/* ---- Sidebar colapsado (preferencia de UI) ---- */
let collapsed = false;
const subsRail = new Set<() => void>();
export const setRailCollapsed = (v: boolean) => {
  collapsed = v;
  try { localStorage.setItem('sgo-rail', v ? '1' : '0'); } catch { /* sin storage */ }
  subsRail.forEach((s) => s());
};
export const loadRailPref = () => { try { if (localStorage.getItem('sgo-rail') === '1') setRailCollapsed(true); } catch { /* sin storage */ } };
export const useRailCollapsed = () => useSyncExternalStore((cb) => { subsRail.add(cb); return () => { subsRail.delete(cb); }; }, () => collapsed, () => false);

/* ---- Guía de bienvenida por rol ---- */
let guia = false;
const subsGuia = new Set<() => void>();
export const abrirGuia = () => { guia = true; subsGuia.forEach((s) => s()); };
export const cerrarGuia = () => { guia = false; subsGuia.forEach((s) => s()); };
export const useGuia = () => useSyncExternalStore((cb) => { subsGuia.add(cb); return () => { subsGuia.delete(cb); }; }, () => guia, () => false);
