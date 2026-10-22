'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowRight } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { OtrPlate } from '@/components/primitives';
import { AREA_COLOR, Area } from '@/lib/mock';
import { diasHasta, HOY, useConfig, isoToDmy, logEvent, maqStore, otrStore, semaforo } from '@/lib/data';
import { capacidadArea, carga } from '@/lib/capacidad';
import { usePerm } from '@/lib/roles';
import { toastUndo } from '@/lib/undo';
import classes from './capacidad.module.css';

const MS = 86400000;
const addDays = (iso: string, d: number) => new Date(new Date(iso + 'T12:00:00Z').getTime() + d * MS).toISOString().slice(0, 10);
const tono = (p: number) => (p > 100 ? 'crit' : p > 80 ? 'warn' : 'ok');

export default function CapacidadPage() {
  const otrs = otrStore.use();
  const maqs = maqStore.use();
  const conf = useConfig();
  const can = usePerm();
  const [det, setDet] = useState<{ area: Area; sem: number } | null>(null);
  const { semanas, map, areas } = useMemo(() => carga(otrs, HOY), [otrs]);

  const celdas = useMemo(() => areas.map((a) => {
    const cap = capacidadArea(a, maqs, conf.horasSemana, conf.disponibilidad);
    return { area: a, cap, filas: semanas.map((_, i) => { const ap = map.get(a)![i]; const h = Math.round(ap.reduce((x, y) => x + y.horas, 0)); return { h, pct: cap ? Math.round((h / cap) * 100) : 0, ap }; }) };
  }), [areas, maqs, map, semanas, conf]);

  const sobrecargas = celdas.flatMap((c) => c.filas.map((f, i) => ({ area: c.area, sem: i, ...f, cap: c.cap }))).filter((x) => x.pct > 100).sort((a, b) => b.pct - a.pct);
  const pico = sobrecargas[0];

  /** Atrasa 7 días la OTR más holgada de la celda sobrecargada. */
  const aliviar = (area: Area, sem: number) => {
    const c = celdas.find((x) => x.area === area)!.filas[sem];
    const cand = [...c.ap].sort((a, b) => b.otr.plazoDias - a.otr.plazoDias).find((x) => x.otr.plazoDias > 30);
    if (!cand) return notifications.show({ message: 'Todas las OTR de esa semana tienen plazo ajustado: conviene sumar capacidad.', color: 'orange' });
    const o = cand.otr; const snap = otrStore.get();
    const fin = addDays(o.fin, 7); const plazoDias = diasHasta(fin);
    otrStore.update(o.id, { inicio: addDays(o.inicio, 7), fin, entrega: isoToDmy(fin), plazoDias, semaforo: semaforo({ avance: o.avance, plazoDias }) });
    logEvent(`Replanificada +7 d por capacidad (${area})`, 'otr', o.id);
    toastUndo('OTR replanificada', `OTR ${o.otr} se atrasa 7 días (nueva entrega ${isoToDmy(fin)})`, () => otrStore.restore(snap));
    setDet(null);
  };

  const detalle = det ? celdas.find((c) => c.area === det.area)!.filas[det.sem] : null;

  return (
    <>
      <PageHead title="Capacidad" sub="Carga vs capacidad por área · próximas 8 semanas" />
      <p className={classes.lead}>Las horas que faltan de cada OTR se reparten en los días que le quedan hasta la entrega. La capacidad sale de las máquinas de cada área ({conf.horasSemana} h/semana al {conf.disponibilidad} % de disponibilidad) o de la cuadrilla base.</p>

      <div className={classes.sheet}>
        <div className={classes.grid} style={{ ['--w' as string]: semanas.length }}>
          <div className={classes.corner}>Área · horas/sem</div>
          {semanas.map((s, i) => <div key={i} className={classes.head} data-now={i === 0 || undefined}>{i === 0 ? 'Esta sem.' : s.label}</div>)}
          {celdas.map((c) => (
            <div key={c.area} className={classes.line}>
              <div className={classes.name} style={{ ['--c' as string]: AREA_COLOR[c.area] }}><i />{c.area}<small className="num">{c.cap} h</small></div>
              {c.filas.map((f, i) => (
                <button key={i} className={classes.cell} data-t={tono(f.pct)} disabled={f.h === 0} onClick={() => setDet({ area: c.area, sem: i })} aria-label={`${c.area}, semana ${semanas[i].label}: ${f.pct}% de carga`}>
                  <b className="num">{f.h ? `${f.pct}%` : '—'}</b>
                  <small className="num">{f.h ? `${f.h} h` : ''}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <ul className={classes.legend}><li data-t="ok"><i />Hasta 80 %</li><li data-t="warn"><i />80 – 100 %</li><li data-t="crit"><i />Sobrecargada</li></ul>

      <section className={classes.alerts}>
        <h2>{sobrecargas.length ? `${sobrecargas.length} semanas sobrecargadas` : 'Sin sobrecargas en el horizonte'}</h2>
        {sobrecargas.length === 0 && <p>La carga prevista cabe en la capacidad de todas las áreas.</p>}
        <ul>
          {sobrecargas.slice(0, 6).map((s) => (
            <li key={`${s.area}-${s.sem}`}>
              <span><b>{s.area}</b><em>Semana del {semanas[s.sem].label}</em><small className="num">{s.h} h de {s.cap} h ({s.pct}%)</small></span>
              <Button size="xs" variant="default" style={{ flex: 'none' }} onClick={() => setDet({ area: s.area, sem: s.sem })} rightSection={<IconArrowRight size={13} />}>Ver y resolver</Button>
            </li>
          ))}
        </ul>
        {pico && <p className={classes.tip}>Mayor presión: <b>{pico.area}</b>, semana del {semanas[pico.sem].label}. Las opciones son atrasar una OTR con holgura, sumar turno o subcontratar.</p>}
      </section>

      <Modal opened={!!det} onClose={() => setDet(null)} size={560} padding="lg" title={det && <b>{det.area} · semana del {semanas[det.sem].label}</b>}>
        {det && detalle && (
          <div className={classes.detail}>
            <p className="cap">Horas que aporta cada OTR</p>
            <ul>
              {[...detalle.ap].sort((a, b) => b.horas - a.horas).map((a) => (
                <li key={a.otr.id}>
                  <Link href={`/seguimiento?otr=${a.otr.id}`}><OtrPlate n={a.otr.otr} /><span>{a.otr.titulo}<small>Entrega {a.otr.entrega} · {a.otr.plazoDias} d</small></span></Link>
                  <b className="num">{Math.round(a.horas)} h</b>
                </li>
              ))}
            </ul>
            {detalle.pct > 100 && can('plan.edit') && <Button color="forja" onClick={() => aliviar(det.area, det.sem)}>Atrasar 7 días la OTR con más holgura</Button>}
            {detalle.pct > 100 && !can('plan.edit') && <p className={classes.ro}>Tu rol no puede replanificar. Avisa a Producción o Gerencia.</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
