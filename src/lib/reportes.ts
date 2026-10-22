import { CLP, AREA_COLOR, Area, Cliente, CubLinea, HH, MaterialRow, NC, Otr, Cambio, estacion, RUTA } from './mock';

export interface Bar { label: string; value: number; color?: string; text?: string }
export interface Reporte {
  titulo: string;
  desc: string;
  kpis: [string, string][];
  chartTitle: string;
  bars: Bar[];
  columns: string[];
  rows: (string | number)[][];
  align?: ('l' | 'r')[]; // por columna
}
export interface Datos { otrs: Otr[]; hh: HH[]; cub: CubLinea[]; cambios: Cambio[]; mats: MaterialRow[]; ncs: NC[]; clientes: Cliente[] }

export const REPORTES = [
  { id: 'avance', nombre: 'Avance de producción', corto: 'Avance por OTR y área', usaFiltros: true },
  { id: 'plazos', nombre: 'Cumplimiento de plazos', corto: 'Entregas por vencer', usaFiltros: true },
  { id: 'hh', nombre: 'Horas hombre', corto: 'HH y costo de mano de obra', usaFiltros: true },
  { id: 'pl', nombre: 'Rentabilidad (P&L)', corto: 'Margen por OTR', usaFiltros: true },
  { id: 'inv', nombre: 'Inventario valorizado', corto: 'Stock y valor por tipo', usaFiltros: false },
  { id: 'nc', nombre: 'Calidad · no conformidades', corto: 'NC por severidad y estado', usaFiltros: false },
] as const;
export type ReporteId = (typeof REPORTES)[number]['id'];

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const avg = (a: number[]) => (a.length ? Math.round(sum(a) / a.length) : 0);
const pct = (n: number) => `${n}%`;
export const STATUS_TXT = { ok: 'Al día', warn: 'Alerta', crit: 'Crítico' } as const;

/** Costos de una OTR a partir de cubicación, HH y cambios aprobados. */
export function costosOtr(o: Otr, d: Pick<Datos, 'hh' | 'cub' | 'cambios'>) {
  const mat = sum(d.cub.filter((l) => l.otrId === o.id).map((l) => l.cant * l.costo));
  const horas = sum(d.hh.filter((h) => h.otrId === o.id).map((h) => h.horas));
  const mo = sum(d.hh.filter((h) => h.otrId === o.id).map((h) => h.horas * h.tarifa));
  const camb = sum(d.cambios.filter((c) => c.otrId === o.id && c.estado === 'Aprobado').map((c) => c.costo));
  const venta = (o.venta ?? 0) + camb;
  const margen = venta - mat - mo;
  return { mat, horas, mo, venta, margen, pct: venta ? Math.round((margen / venta) * 100) : 0 };
}

export function build(id: ReporteId, d: Datos, f: { area: string; cliente: string }): Reporte {
  const otrs = d.otrs.filter((o) => (f.area === 'todas' || o.area === f.area) && (f.cliente === 'todos' || o.cliente === f.cliente));

  if (id === 'avance') {
    const areas = [...new Set(otrs.map((o) => o.area))] as Area[];
    return {
      titulo: 'Avance de producción', desc: 'Estado de cada OTR, estación de ruta y semáforo de plazo.',
      kpis: [['OTR', String(otrs.length)], ['Avance promedio', pct(avg(otrs.map((o) => o.avance)))], ['Críticas', String(otrs.filter((o) => o.semaforo[1] === 'crit').length)], ['Terminadas (100 %)', String(otrs.filter((o) => o.avance === 100).length)]],
      chartTitle: 'Avance promedio por área',
      bars: areas.map((a) => ({ label: a, value: avg(otrs.filter((o) => o.area === a).map((o) => o.avance)), color: AREA_COLOR[a], text: pct(avg(otrs.filter((o) => o.area === a).map((o) => o.avance))) })),
      columns: ['OTR', 'Trabajo', 'Cliente', 'Área', 'Estación', 'Avance %', 'Entrega', 'Plazo'],
      rows: otrs.map((o) => [o.otr, o.titulo, o.cliente, o.area, RUTA[estacion(o)], o.avance, o.entrega, STATUS_TXT[o.semaforo[1]]]),
      align: ['l', 'l', 'l', 'l', 'l', 'r', 'l', 'l'],
    };
  }

  if (id === 'plazos') {
    const b = [
      { label: 'Vencidas', t: (x: number) => x < 0, c: 'var(--mm-crit)' },
      { label: '0–14 días', t: (x: number) => x >= 0 && x <= 14, c: 'var(--mm-crit)' },
      { label: '15–30 días', t: (x: number) => x > 14 && x <= 30, c: 'var(--mm-warn)' },
      { label: '31–60 días', t: (x: number) => x > 30 && x <= 60, c: 'var(--mm-ok)' },
      { label: 'Más de 60', t: (x: number) => x > 60, c: 'var(--mm-ok)' },
    ];
    const ord = [...otrs].sort((x, y) => x.plazoDias - y.plazoDias);
    return {
      titulo: 'Cumplimiento de plazos', desc: 'Entregas ordenadas por urgencia.',
      kpis: [['Vencidas', String(otrs.filter((o) => o.plazoDias < 0).length)], ['≤ 14 días', String(otrs.filter((o) => o.plazoDias >= 0 && o.plazoDias <= 14).length)], ['≤ 30 días', String(otrs.filter((o) => o.plazoDias <= 30).length)], ['Plazo promedio', `${avg(otrs.map((o) => o.plazoDias))} d`]],
      chartTitle: 'OTR por tramo de plazo',
      bars: b.map((x) => ({ label: x.label, value: otrs.filter((o) => x.t(o.plazoDias)).length, color: x.c })),
      columns: ['OTR', 'Trabajo', 'Cliente', 'Entrega', 'Plazo (d)', 'Avance %', 'Estado'],
      rows: ord.map((o) => [o.otr, o.titulo, o.cliente, o.entrega, o.plazoDias, o.avance, STATUS_TXT[o.semaforo[1]]]),
      align: ['l', 'l', 'l', 'l', 'r', 'r', 'l'],
    };
  }

  if (id === 'hh') {
    const filas = otrs.map((o) => ({ o, ...costosOtr(o, d) })).filter((x) => x.horas > 0);
    return {
      titulo: 'Horas hombre', desc: 'Horas registradas y costo de mano de obra por OTR.',
      kpis: [['Horas totales', String(sum(filas.map((x) => x.horas)))], ['Costo mano de obra', CLP(sum(filas.map((x) => x.mo)))], ['OTR con HH', String(filas.length)], ['Costo promedio/hora', CLP(sum(filas.map((x) => x.horas)) ? Math.round(sum(filas.map((x) => x.mo)) / sum(filas.map((x) => x.horas))) : 0)]],
      chartTitle: 'Horas por OTR',
      bars: filas.map((x) => ({ label: `OTR ${x.o.otr}`, value: x.horas, color: AREA_COLOR[x.o.area], text: `${x.horas} h` })),
      columns: ['OTR', 'Trabajo', 'Cliente', 'Horas', 'Costo MO'],
      rows: filas.map((x) => [x.o.otr, x.o.titulo, x.o.cliente, x.horas, CLP(x.mo)]),
      align: ['l', 'l', 'l', 'r', 'r'],
    };
  }

  if (id === 'pl') {
    const filas = otrs.map((o) => ({ o, ...costosOtr(o, d) }));
    const venta = sum(filas.map((x) => x.venta));
    const margen = sum(filas.map((x) => x.margen));
    return {
      titulo: 'Rentabilidad (P&L)', desc: 'Venta contratada menos materiales (cubicación) y mano de obra (HH). Sin overhead.',
      kpis: [['Venta total', CLP(venta)], ['Costo directo', CLP(venta - margen)], ['Margen', CLP(margen)], ['Margen %', pct(venta ? Math.round((margen / venta) * 100) : 0)]],
      chartTitle: 'Margen % por OTR',
      bars: filas.filter((x) => x.venta).map((x) => ({ label: `OTR ${x.o.otr}`, value: Math.max(0, x.pct), color: x.pct >= 25 ? 'var(--mm-ok)' : x.pct >= 10 ? 'var(--mm-warn)' : 'var(--mm-crit)', text: pct(x.pct) })),
      columns: ['OTR', 'Trabajo', 'Cliente', 'Venta', 'Materiales', 'Mano de obra', 'Margen', 'Margen %'],
      rows: filas.map((x) => [x.o.otr, x.o.titulo, x.o.cliente, CLP(x.venta), CLP(x.mat), CLP(x.mo), CLP(x.margen), x.pct]),
      align: ['l', 'l', 'l', 'r', 'r', 'r', 'r', 'r'],
    };
  }

  if (id === 'inv') {
    const tipos = [...new Set(d.mats.map((m) => m.tipo))];
    const val = (m: MaterialRow) => m.stock * m.precio;
    return {
      titulo: 'Inventario valorizado', desc: 'Stock actual valorizado a precio unitario.',
      kpis: [['Valor total', CLP(sum(d.mats.map(val)))], ['Referencias', String(d.mats.length)], ['Sin stock', String(d.mats.filter((m) => m.stock === 0).length)], ['Stock bajo (<5)', String(d.mats.filter((m) => m.stock > 0 && m.stock < 5).length)]],
      chartTitle: 'Valor por tipo de material (millones CLP)',
      bars: tipos.map((t) => { const v = sum(d.mats.filter((m) => m.tipo === t).map(val)); return { label: t, value: Math.round(v / 1000) / 1000, color: 'var(--mm-ink)', text: `$${(v / 1e6).toFixed(1)} M` }; }),
      columns: ['Tipo', 'Descripción', 'Stock', 'Precio unit.', 'Valor'],
      rows: d.mats.map((m) => [m.tipo, m.descripcion, m.stock, CLP(m.precio), CLP(val(m))]),
      align: ['l', 'l', 'r', 'r', 'r'],
    };
  }

  const sev = ['Crítica', 'Mayor', 'Menor'] as const;
  return {
    titulo: 'Calidad · no conformidades', desc: 'Registro de NC por severidad y estado.',
    kpis: [['Total NC', String(d.ncs.length)], ['Abiertas', String(d.ncs.filter((n) => n.estado !== 'Cerrada').length)], ['Críticas abiertas', String(d.ncs.filter((n) => n.severidad === 'Crítica' && n.estado !== 'Cerrada').length)], ['Cerradas', String(d.ncs.filter((n) => n.estado === 'Cerrada').length)]],
    chartTitle: 'NC por severidad',
    bars: sev.map((s) => ({ label: s, value: d.ncs.filter((n) => n.severidad === s).length, color: s === 'Crítica' ? 'var(--mm-crit)' : s === 'Mayor' ? 'var(--mm-warn)' : 'var(--mm-ink-4)' })),
    columns: ['Fecha', 'Título', 'Severidad', 'Estado', 'Responsable', 'OTR'],
    rows: d.ncs.map((n) => [n.fecha, n.titulo, n.severidad, n.estado, n.responsable, d.otrs.find((o) => o.id === n.otrId)?.otr ?? '—']),
    align: ['l', 'l', 'l', 'l', 'l', 'l'],
  };
}

/* ---------- exportar ---------- */
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
export function descargarCSV(r: Reporte) {
  const body = [r.columns, ...r.rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${r.titulo.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-2026-10-21.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const esc = (t: string | number) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
export function imprimirReporte(r: Reporte) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>${esc(r.titulo)}</title>
  <style>body{font:13px system-ui,sans-serif;margin:28px;color:#16181d}header{border-bottom:3px solid #f5821f;padding-bottom:10px;margin-bottom:16px}h1{margin:0;font-size:22px}p{margin:4px 0 0;color:#555}
  .k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}.k div{border:1px solid #ccc;padding:8px 10px}.k small{display:block;font:10px monospace;text-transform:uppercase;color:#777}.k b{font-size:18px}
  table{width:100%;border-collapse:collapse}th{text-align:left;font:10px monospace;text-transform:uppercase;color:#777;border-bottom:2px solid #16181d;padding:5px}td{padding:5px;border-bottom:1px solid #ddd}
  footer{margin-top:18px;font-size:11px;color:#777}</style>
  <header><h1>${esc(r.titulo)}</h1><p>${esc(r.desc)} · Maestranza Mena · 21-10-2026</p></header>
  <div class="k">${r.kpis.map(([l, v]) => `<div><small>${esc(l)}</small><b>${esc(v)}</b></div>`).join('')}</div>
  <table><thead><tr>${r.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${r.rows.map((row) => `<tr>${row.map((c, i) => `<td${r.align?.[i] === 'r' ? ' style="text-align:right"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <footer>Generado desde SGO · Panamericana Norte Km 107, Hijuelas</footer><script>setTimeout(()=>window.print(),300)</script></html>`);
  w.document.close();
}
