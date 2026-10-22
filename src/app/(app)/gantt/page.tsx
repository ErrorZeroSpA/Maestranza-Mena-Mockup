'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, SegmentedControl, Select, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconMinus, IconPencil, IconPlus, IconX } from '@tabler/icons-react';
import { PageHead } from '@/components/PageHead';
import { AREA_COLOR, Area } from '@/lib/mock';
import { usePerm } from '@/lib/roles';
import { diasHasta, HOY, isoToDmy, logEvent, otrStore, semaforo } from '@/lib/data';
import classes from './gantt.module.css';

const MS = 86400000;
const at = (iso: string) => new Date(iso + 'T12:00:00').getTime();
const addDays = (iso: string, d: number) => new Date(at(iso) + d * MS).toISOString().slice(0, 10);

export default function GanttPage() {
  const router = useRouter();
  const can = usePerm();
  const wrapRef = useRef<HTMLDivElement>(null);
  const OTRS = otrStore.use();
  const [area, setArea] = useState<string | null>('todas');
  const [plan, setPlan] = useState(false);
  const [zoom, setZoom] = useState<string>('dia');
  const [cerrados, setCerrados] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, { inicio: string; fin: string }>>({});
  const dw = zoom === 'dia' ? 24 : 9;

  const rows = useMemo(
    () => OTRS.filter((o, i, a) => a.findIndex((x) => x.otr === o.otr) === i).filter((o) => area === 'todas' || o.area === area),
    [OTRS, area],
  );
  const areasEnUso = [...new Set(rows.map((o) => o.area))] as Area[];
  const eff = (o: (typeof rows)[number]) => draft[o.id] ?? { inicio: o.inicio, fin: o.fin };

  const minIso = rows.length ? rows.reduce((m, o) => (eff(o).inicio < m ? eff(o).inicio : m), eff(rows[0]).inicio) : HOY;
  const maxIso = rows.length ? rows.reduce((m, o) => (eff(o).fin > m ? eff(o).fin : m), eff(rows[0]).fin) : HOY;
  const START = new Date(at(minIso));
  const DAYS = Math.max(42, Math.round((at(maxIso) - at(minIso)) / MS) + 4);
  const day = (iso: string) => Math.round((at(iso) - START.getTime()) / MS);
  const dates = Array.from({ length: DAYS }, (_, i) => new Date(START.getTime() + i * MS));
  const hoy = day(HOY);
  const cambios = Object.keys(draft).length;

  // centra la vista en la línea de hoy al abrir
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || hoy < 0) return;
    const lw = el.querySelector<HTMLElement>('[class*=corner]')?.clientWidth ?? 230;
    el.scrollLeft = Math.max(0, lw + (hoy / DAYS) * (el.scrollWidth - lw) - (el.clientWidth + lw) / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, zoom]);

  const shift = (o: (typeof rows)[number], di: number, df: number) => {
    const cur = eff(o);
    const inicio = addDays(cur.inicio, di);
    const fin = addDays(cur.fin, df);
    if (fin < inicio) return;
    setDraft((d) => ({ ...d, [o.id]: { inicio, fin } }));
  };
  const guardar = () => {
    Object.entries(draft).forEach(([id, v]) => {
      const o = OTRS.find((x) => x.id === id);
      if (!o) return;
      const plazoDias = diasHasta(v.fin);
      otrStore.update(id, { inicio: v.inicio, fin: v.fin, entrega: isoToDmy(v.fin), plazoDias, semaforo: semaforo({ avance: o.avance, plazoDias }) });
      logEvent(`Replanificada: entrega ${isoToDmy(v.fin)}`, 'otr', id);
    });
    notifications.show({ title: 'Plan guardado', message: `${cambios} OTR replanificadas.`, color: 'teal' });
    setDraft({});
    setPlan(false);
  };
  const salir = () => { setDraft({}); setPlan(false); };

  return (
    <>
      <PageHead
        title="Cronograma (Gantt)"
        sub={`${rows.length} órdenes · ${areasEnUso.length} áreas · barra rellena = avance`}
        right={
          <div className={classes.tools}>
            <Select label="Área" size="sm" w={220} allowDeselect={false} value={area} onChange={setArea}
              data={[{ value: 'todas', label: 'Todas las áreas' }, ...(Object.keys(AREA_COLOR) as Area[]).map((a) => ({ value: a, label: a }))]} />
            <SegmentedControl size="sm" value={zoom} onChange={setZoom} data={[{ value: 'dia', label: 'Días' }, { value: 'semana', label: 'Semanas' }]} aria-label="Escala de tiempo" />
            {!can('plan.edit') ? null : !plan ? (
              <Button color="forja" leftSection={<IconPencil size={16} />} onClick={() => setPlan(true)}>Planificar</Button>
            ) : (
              <>
                <Button variant="default" leftSection={<IconX size={16} />} onClick={salir}>Descartar</Button>
                <Button color="forja" leftSection={<IconCheck size={16} />} disabled={!cambios} onClick={guardar}>Guardar plan{cambios ? ` (${cambios})` : ''}</Button>
              </>
            )}
          </div>
        }
      />
      {plan && <p className={classes.planNote}>Modo planificación: mueve (‹ ›) o alarga (− +) las barras. Los cambios no se aplican hasta guardar.</p>}

      <div ref={wrapRef} className={classes.wrap} data-plan={plan || undefined}>
        <div className={classes.grid} style={{ ['--days' as string]: DAYS, ['--dw' as string]: `${dw}px` }}>
          <div className={classes.corner}>Orden de trabajo</div>
          <div className={classes.axis}>
            {dates.map((d, i) => (
              <div key={i} className={classes.tick} data-month={d.getDate() === 1 || i === 0 || undefined} data-we={[0, 6].includes(d.getDay()) || undefined} data-hoy={i === hoy || undefined}>
                {(d.getDate() === 1 || i === 0) && <em>{d.toLocaleDateString('es-CL', { month: 'long' })}</em>}
                <span className="num">{zoom === 'dia' || d.getDay() === 1 ? String(d.getDate()).padStart(2, '0') : ''}</span>
              </div>
            ))}
            {hoy >= 0 && hoy < DAYS && <span className={classes.todayTag} style={{ left: `${((hoy + 0.5) / DAYS) * 100}%` }}>HOY</span>}
          </div>

          {areasEnUso.map((a) => {
            const grupo = rows.filter((o) => o.area === a);
            const prom = Math.round(grupo.reduce((x, o) => x + o.avance, 0) / grupo.length);
            const cerrado = cerrados[a];
            return (
              <div key={a} className={classes.group}>
                <button className={classes.groupHead} aria-expanded={!cerrado} onClick={() => setCerrados((c) => ({ ...c, [a]: !c[a] }))} style={{ ['--c' as string]: AREA_COLOR[a] }}>
                  <IconChevronDown size={14} data-closed={cerrado || undefined} />
                  <i />
                  {a}
                  <em className="num">{grupo.length}</em>
                  <span className="num">{prom}% de avance</span>
                </button>
                <div className={classes.groupBand} aria-hidden />

                {!cerrado && grupo.map((o) => {
                  const v = eff(o);
                  const s = Math.max(0, day(v.inicio));
                  const e = Math.min(DAYS, day(v.fin) + 1);
                  const dirty = !!draft[o.id];
                  return (
                    <div key={o.id} className={classes.row}>
                      <div className={classes.label}>
                        <b className="num">{o.otr}</b>
                        <span>{o.titulo}</span>
                      </div>
                      <div className={classes.lane}>
                        {hoy >= 0 && hoy < DAYS && <div className={classes.today} style={{ left: `${((hoy + 0.5) / DAYS) * 100}%` }} />}
                        <Tooltip label={`${o.cliente} · entrega ${isoToDmy(v.fin)} · ${o.avance}%`} position="top" disabled={plan}>
                          <div
                            className={classes.bar}
                            data-dirty={dirty || undefined}
                            role="button"
                            tabIndex={0}
                            aria-label={`OTR ${o.otr}, ${o.titulo}, ${o.avance}% de avance`}
                            onClick={() => !plan && router.push(`/seguimiento?otr=${o.id}`)}
                            onKeyDown={(ev) => ev.key === 'Enter' && !plan && router.push(`/seguimiento?otr=${o.id}`)}
                            style={{ left: `${(s / DAYS) * 100}%`, width: `${((e - s) / DAYS) * 100}%`, ['--c' as string]: AREA_COLOR[o.area] }}
                          >
                            <i style={{ width: `${o.avance}%` }} />
                            <span>{o.titulo}</span>
                            <b className="num">{o.avance}%</b>
                          </div>
                        </Tooltip>
                        <span className={classes.milestone} style={{ left: `${(e / DAYS) * 100}%` }} title={`Entrega ${isoToDmy(v.fin)}`} />
                        {plan && (
                          <div className={classes.ctl} style={{ left: `calc(${(e / DAYS) * 100}% + 12px)` }}>
                            <button aria-label="Adelantar un día" onClick={() => shift(o, -1, -1)}><IconChevronLeft size={13} /></button>
                            <button aria-label="Atrasar un día" onClick={() => shift(o, 1, 1)}><IconChevronRight size={13} /></button>
                            <button aria-label="Acortar un día" onClick={() => shift(o, 0, -1)}><IconMinus size={13} /></button>
                            <button aria-label="Alargar un día" onClick={() => shift(o, 0, 1)}><IconPlus size={13} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {rows.length === 0 && <p className={classes.empty}>No hay órdenes para este filtro.</p>}
        </div>
      </div>
    </>
  );
}
