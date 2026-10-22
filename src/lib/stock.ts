import type { CubLinea, MaterialRow, Otr } from './mock';

/** Cantidad de un material ya comprometida por cubicaciones aprobadas y aún no consumidas. */
export function comprometido(matId: string, cub: CubLinea[], otrs: Otr[]) {
  return cub
    .filter((l) => l.matId === matId)
    .filter((l) => { const o = otrs.find((x) => x.id === l.otrId); return !!o && (o.cubPaso ?? 0) >= 2 && !o.cubConsumida; })
    .reduce((a, l) => a + l.cant, 0);
}

/** Faltantes: lo comprometido que supera el stock. Alimenta la reposición de Compras. */
export function faltantes(mats: MaterialRow[], cub: CubLinea[], otrs: Otr[]) {
  return mats
    .map((m) => ({ m, comp: comprometido(m.id, cub, otrs) }))
    .map(({ m, comp }) => ({ m, comp, falta: Math.max(0, comp - m.stock) }))
    .filter((x) => x.falta > 0);
}
