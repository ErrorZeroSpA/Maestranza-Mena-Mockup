'use client';

import Link from 'next/link';
import { Button } from '@mantine/core';
import { IconAlertOctagon, IconBoxSeam, IconCamera, IconChecklist, IconChevronRight, IconPlus, IconShieldCheck, IconTool } from '@tabler/icons-react';
import { OtrPlate } from '@/components/primitives';
import { AREA_COLOR, Area, CLP, estacion, RUTA } from '@/lib/mock';
import { costosOtr, REPORTES } from '@/lib/reportes';
import { cambioStore, cubStore, hhStore, logStore, maqStore, matStore, ncStore, otrStore, relFecha, tareaStore, HOY, dmyToIso } from '@/lib/data';
import { openOtrForm } from '@/lib/ui';
import classes from './inicio.module.css';

const sinStockN = (m: { stock: number }[]) => m.filter((x) => x.stock === 0).length;

export default function InicioPage() {
  const otrs = otrStore.use();
  const mats = matStore.use();
  const ncs = ncStore.use();
  const tareas = tareaStore.use();
  const log = logStore.use().slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);
  const cub = cubStore.use();
  const hh = hhStore.use();
  const cambios = cambioStore.use();

  const porEstacion = RUTA.map((_, i) => otrs.filter((o) => estacion(o) === i));
  const max = Math.max(1, ...porEstacion.map((x) => x.length));
  const criticas = otrs.filter((o) => o.semaforo[1] === 'crit');
  const ncAbiertas = ncs.filter((n) => n.estado !== 'Cerrada');
  const sinStock = mats.filter((m) => m.stock === 0);
  const vencidas = tareas.filter((t) => t.estado !== 'Hecha' && t.vence !== '—' && dmyToIso(t.vence) <= HOY);
  const proximas = otrs.filter((o) => o.plazoDias <= 30).sort((a, b) => a.plazoDias - b.plazoDias).slice(0, 5);

  const fin = otrs.map((o) => costosOtr(o, { hh, cub, cambios }));
  const costeadas = fin.filter((x) => x.mat + x.mo > 0); // el margen solo cuenta OTR con costos cargados
  const venta = costeadas.reduce((a, x) => a + x.venta, 0);
  const margen = costeadas.reduce((a, x) => a + x.margen, 0);
  const cartera = fin.reduce((a, x) => a + x.venta, 0);
  const aTiempo = otrs.length ? Math.round((otrs.filter((o) => o.semaforo[1] !== 'crit').length / otrs.length) * 100) : 0;
  const valorInv = mats.reduce((a, m) => a + m.stock * m.precio, 0);
  const avanceProm = otrs.length ? Math.round(otrs.reduce((a, o) => a + o.avance, 0) / otrs.length) : 0;
  const areas = [...new Set(otrs.map((o) => o.area))] as Area[];
  const kpis: [string, string, string][] = [
    ['Avance promedio', `${avanceProm}%`, `${otrs.filter((o) => o.avance === 100).length} terminadas`],
    ['Plazos en regla', `${aTiempo}%`, `${criticas.length} críticas`],
    ['Cartera en curso', `$${(cartera / 1e6).toFixed(1)} M`, `${otrs.length} OTR`],
    ['Margen estimado', venta ? `${Math.round((margen / venta) * 100)}%` : '—', `${costeadas.length} OTR costeadas`],
    ['Inventario valorizado', `$${(valorInv / 1e6).toFixed(1)} M`, `${sinStockN(mats)} sin stock`],
  ];

  const maqs = maqStore.use();
  const detenidas = maqs.filter((m) => m.estado !== 'Operando');
  const alertas = [
    { href: '/seguimiento', icon: IconAlertOctagon, tone: 'crit', n: criticas.length, t: 'OTR con plazo crítico', s: [...new Set(criticas.map((o) => o.otr))].slice(0, 3).join(' · ') },
    { href: '/calidad', icon: IconShieldCheck, tone: 'warn', n: ncAbiertas.length, t: 'No conformidades abiertas', s: ncAbiertas.filter((n) => n.severidad === 'Crítica').length + ' crítica(s)' },
    { href: '/maquinas', icon: IconTool, tone: 'warn', n: detenidas.length, t: 'Máquinas detenidas', s: detenidas.slice(0, 2).map((m) => m.nombre).join(' · ') || 'Todas operando' },
    { href: '/inventario', icon: IconBoxSeam, tone: 'warn', n: sinStock.length, t: 'Materiales sin stock', s: sinStock.slice(0, 2).map((m) => m.tipo).join(' · ') },
    { href: '/tareas', icon: IconChecklist, tone: 'ok', n: vencidas.length, t: 'Tareas vencidas o para hoy', s: vencidas[0]?.titulo.slice(0, 34) ?? 'Todo al día' },
  ];

  return (
    <>
      <header className={classes.hello}>
        <div>
          <span className="cap">Planta Hijuelas · Turno día 08:00 – 18:00</span>
          <h1>Buen día, Felipe.</h1>
          <p>{otrs.length} órdenes en planta, {criticas.length} con plazo crítico y {ncAbiertas.length} no conformidades abiertas.</p>
        </div>
        <div className={classes.quick}>
          <Button color="forja" leftSection={<IconPlus size={16} />} onClick={() => openOtrForm()}>Nueva OTR</Button>
          <Button component={Link} href="/evidencia/nueva" variant="default" leftSection={<IconCamera size={16} />}>Capturar evidencia</Button>
          <Button component={Link} href="/calidad" variant="default" leftSection={<IconShieldCheck size={16} />}>Reportar NC</Button>
        </div>
      </header>

      <section className={classes.kpiBand} aria-label="Indicadores clave">
        {kpis.map(([l, v, s]) => (
          <div key={l}><span className="cap">{l}</span><b className="num">{v}</b><small>{s}</small></div>
        ))}
      </section>

      <section className={classes.funnel} aria-label="OTR por estación de la ruta">
        <div className={classes.fHead}><h2>Ruta de planta</h2><span className="cap">OTR por estación · clic para ver</span></div>
        <ol>
          {RUTA.map((r, i) => (
            <li key={r}>
              <Link href="/seguimiento">
                <b className="num">{porEstacion[i].length}</b>
                <div className={classes.col}><i style={{ height: `${(porEstacion[i].length / max) * 100}%` }} /></div>
                <span>{r}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className={classes.grid}>
        <section className={classes.card}>
          <h2>Requiere atención</h2>
          <ul className={classes.alerts}>
            {alertas.map((a) => (
              <li key={a.t}>
                <Link href={a.href} data-tone={a.n === 0 ? 'ok' : a.tone}>
                  <a.icon size={20} stroke={1.6} />
                  <span><b>{a.t}</b><small>{a.s || '—'}</small></span>
                  <em className="num">{a.n}</em>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={classes.card}>
          <h2>Entregas en 30 días</h2>
          <ul className={classes.deliv}>
            {proximas.map((o) => (
              <li key={o.id}>
                <Link href={`/seguimiento?otr=${o.id}`}>
                  <OtrPlate n={o.otr} />
                  <span>{o.titulo}<small>{o.cliente}</small></span>
                  <b className="num" data-crit={o.plazoDias <= 14 || undefined}>{o.plazoDias} d</b>
                </Link>
              </li>
            ))}
            {proximas.length === 0 && <li className={classes.empty}>Sin entregas próximas.</li>}
          </ul>
        </section>

        <section className={classes.card}>
          <h2>Avance por área</h2>
          <ul className={classes.areas}>
            {areas.map((a) => {
              const xs = otrs.filter((o) => o.area === a);
              const p = Math.round(xs.reduce((s, o) => s + o.avance, 0) / xs.length);
              return (
                <li key={a}>
                  <div><span>{a}</span><b className="num">{p}%</b></div>
                  <div className={classes.track}><i style={{ width: `${p}%`, background: AREA_COLOR[a] }} /></div>
                  <small>{xs.length} OTR</small>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={classes.card}>
          <h2>Reportes</h2>
          <ul className={classes.reports}>
            {REPORTES.map((r) => (
              <li key={r.id}><Link href={`/reportes?r=${r.id}`}><span><b>{r.nombre}</b><small>{r.corto}</small></span><IconChevronRight size={16} /></Link></li>
            ))}
          </ul>
          <Link href="/reportes" className={classes.more}>Abrir centro de reportes →</Link>
        </section>

        <section className={classes.card}>
          <h2>Actividad reciente</h2>
          <ul className={classes.feed}>
            {log.map((e) => (
              <li key={e.id}><span className="mono">{relFecha(e.fecha)}</span><p>{e.texto}</p></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
