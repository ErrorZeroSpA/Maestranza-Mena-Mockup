import { AREA_COLOR, Area, Maquina, Otr } from './mock';

export const SEMANAS = 8;
const MS = 86400000;
const t = (iso: string) => new Date(iso + 'T12:00:00Z').getTime();
const lunes = (iso: string) => { const d = new Date(t(iso)); const dow = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - dow * MS); };

/** Horas base por semana de áreas sin máquinas (cuadrillas de oficina o terreno). */
const BASE: Partial<Record<Area, number>> = { Ingeniería: 80, 'Mantenimiento y Reparación': 120 };

export function semanasDesde(hoy: string) {
  const ini = lunes(hoy);
  return Array.from({ length: SEMANAS }, (_, i) => {
    const d = new Date(ini.getTime() + i * 7 * MS);
    return { ini: d, fin: new Date(d.getTime() + 7 * MS), label: d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', timeZone: 'UTC' }) };
  });
}

export function capacidadArea(area: Area, maqs: Maquina[], horasSemana = 45, disponibilidad = 85) {
  const n = maqs.filter((m) => m.area === area).length;
  return Math.round(BASE[area] ?? n * horasSemana * (disponibilidad / 100));
}

export interface Aporte { otr: Otr; horas: number }
/** Carga por área y semana: las horas que faltan de cada OTR se reparten en los días que le quedan. */
export function carga(otrs: Otr[], hoy: string) {
  const semanas = semanasDesde(hoy);
  const map = new Map<string, Aporte[][]>();
  for (const o of otrs) {
    const restante = (o.hhEst ?? 40) * (1 - o.avance / 100);
    if (restante <= 0) continue;
    const ini = Math.max(t(o.inicio), t(hoy));
    const fin = Math.max(t(o.fin), ini + MS);
    const dias = Math.max(1, Math.round((fin - ini) / MS));
    const porDia = restante / dias;
    const filas = map.get(o.area) ?? Array.from({ length: SEMANAS }, () => [] as Aporte[]);
    semanas.forEach((s, i) => {
      const a = Math.max(ini, s.ini.getTime());
      const b = Math.min(fin, s.fin.getTime());
      const d = Math.max(0, Math.round((b - a) / MS));
      if (d > 0) filas[i].push({ otr: o, horas: Math.round(porDia * d * 10) / 10 });
    });
    map.set(o.area, filas);
  }
  return { semanas, map, areas: [...map.keys()] as Area[], color: AREA_COLOR };
}
