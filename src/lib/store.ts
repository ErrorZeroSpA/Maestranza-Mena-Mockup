import { useSyncExternalStore } from 'react';

/**
 * Almacén en memoria para el mockup: el CRUD funciona en pantalla, pero no persiste.
 * Al recargar la página vuelve a los datos de ejemplo. Misma forma de uso (lista + add/update/remove)
 * que tendrá la capa real sobre Postgres.
 */
export function createStore<T extends { id: string | number }>(seed: T[]) {
  let state = seed;
  const subs = new Set<() => void>();
  const set = (next: T[]) => { state = next; subs.forEach((f) => f()); };

  return {
    use: () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => state, () => seed),
    get: () => state,
    add: (item: T) => set([item, ...state]),
    update: (id: T['id'], patch: Partial<T>) => set(state.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    remove: (id: T['id']) => set(state.filter((x) => x.id !== id)),
    reset: () => set(seed),
    /** Vuelve a un estado anterior (usado por «Deshacer»). */
    restore: (snapshot: T[]) => set(snapshot),
  };
}
